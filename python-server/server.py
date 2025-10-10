from flask import Flask, jsonify, request, render_template
from pymongo import MongoClient
from flask_cors import CORS  # Import CORS

import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/waste-management")
db = client["waste-management"]
collection = db["wastebins"]


def _load_bins_df():
    data_cursor = collection.find()
    data = pd.DataFrame(list(data_cursor))
    if data.empty:
        return data
    # Normalize/clean fields expected downstream
    if 'wasteQuantityPerDay' in data.columns:
        data['wasteQuantityPerDay'] = (
            data['wasteQuantityPerDay']
            .astype(str)
            .str.replace(' tonnes', '', regex=False)
        )
        data['wasteQuantityPerDay'] = pd.to_numeric(data['wasteQuantityPerDay'], errors='coerce').fillna(0.0)
    else:
        data['wasteQuantityPerDay'] = 0.0

    if 'lastEmptiedAt' in data.columns:
        data['lastEmptiedAt'] = pd.to_datetime(data['lastEmptiedAt'], errors='coerce').fillna(pd.Timestamp.utcnow())
    else:
        data['lastEmptiedAt'] = pd.Timestamp.utcnow()

    for col in ['totalCapacity', 'realTimeCapacity']:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors='coerce').fillna(0.0)
        else:
            data[col] = 0.0
    return data


@app.route('/schedule', methods=['POST', 'GET'])
def schedule():
    try:
        # Fetch data from MongoDB
        data = _load_bins_df()

        # If no data is returned
        if data.empty:
            return jsonify({"error": "No data found in the database"}), 404

        # Preprocess data
        # Data already normalized in _load_bins_df

        # Calculate predictedApproxTime dynamically
        data['predictedApproxTime'] = (data['totalCapacity'] - data['realTimeCapacity']) / (data['wasteQuantityPerDay'] / 24)

        # Calculate predicted emptying datetime
        data['predictedEmptyingDateTime'] = data.apply(
            lambda row: (row['lastEmptiedAt'] + timedelta(hours=row['predictedApproxTime'])).strftime('%Y-%m-%d %H:%M:%S'),
            axis=1
        )

        # Determine the status based on realTimeCapacity and totalCapacity
        def determine_status(row):
            capacity_ratio = row['realTimeCapacity'] / row['totalCapacity']
            if capacity_ratio >= 0.8:
                return "filled"
            elif 0.3 <= capacity_ratio < 0.8:
                return "partially_filled"
            else:
                return "empty"

        data['status'] = data.apply(determine_status, axis=1)

        # Store original ObjectIds
        original_ids = data['_id'].copy()

        # Save predictions and status back to the database using original ObjectIds
        for i, row in data.iterrows():
            collection.update_one(
                {"_id": original_ids[i]},
                {"$set": {
                    "predictedApproxTime": row['predictedApproxTime'],
                    "predictedEmptyingDateTime": row['predictedEmptyingDateTime'],
                    "status": row['status']
                }}
            )

        # Convert _id to string for response
        data['_id'] = data['_id'].astype(str)

        if request.method == 'POST':
            query_index = int(request.json.get("query_index", 0))
            if query_index < 0 or query_index >= len(data):
                return jsonify({"error": "Invalid query index"}), 400

            bin_data = data.iloc[query_index]
            return jsonify({
                "Bin ID": bin_data['_id'],
                "Predicted Approximate Time": f"{bin_data['predictedApproxTime']:.2f} hrs",
                "Predicted Emptying DateTime": bin_data['predictedEmptyingDateTime'],
                "Status": bin_data['status']
            })

        # For GET requests, return all predictions
        rec = data[['_id', 'predictedApproxTime', 'predictedEmptyingDateTime', 'status', 'ward', 'lastEmptiedAt']].to_dict(orient='records')

        print(rec)  # For debugging

        return jsonify({"rec": rec}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# ML-lite endpoints
@app.route('/ml/forecast', methods=['GET'])
def ml_forecast():
    try:
        data = _load_bins_df()
        if data.empty:
            return jsonify({"bins": []}), 200

        # Simple forecasting: hours until full based on observed per-day quantity
        # predictedApproxTime computed as in schedule
        per_hour = (data['wasteQuantityPerDay'] / 24.0).replace({0.0: 1e-6})
        data['hoursUntilFull'] = (data['totalCapacity'] - data['realTimeCapacity']) / per_hour
        data['predictedFullDateTime'] = data.apply(
            lambda row: (pd.Timestamp.utcnow() + timedelta(hours=float(max(row['hoursUntilFull'], 0)))).strftime('%Y-%m-%d %H:%M:%S'),
            axis=1
        )

        # Return top 10 soon-to-fill
        topk = data.sort_values('hoursUntilFull').head(10).copy()
        # Ensure _id column name is consistent
        if '_id' not in topk.columns:
            # In case of different naming (unlikely), create a placeholder
            topk['_id'] = ''
        cols = ['_id', 'ward', 'zone', 'category', 'realTimeCapacity', 'totalCapacity', 'hoursUntilFull', 'predictedFullDateTime']
        existing_cols = [c for c in cols if c in topk.columns]
        result = topk[existing_cols].copy()
        if '_id' in result.columns:
            result['_id'] = result['_id'].astype(str)
        return jsonify({"bins": result.to_dict(orient='records')}), 200
    except Exception as e:
        print(f"Forecast error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/ml/anomalies', methods=['GET'])
def ml_anomalies():
    try:
        data = _load_bins_df()
        if data.empty:
            return jsonify({"bins": []}), 200

        # Ward-wise z-score for realTimeCapacity
        def zscore(group):
            mean = group['realTimeCapacity'].mean()
            std = group['realTimeCapacity'].std() or 1.0
            return (group['realTimeCapacity'] - mean) / std

        data['z'] = data.groupby(data.get('ward', pd.Series(['unknown'] * len(data))))['realTimeCapacity'].transform(
            lambda s: (s - s.mean()) / (s.std() or 1.0)
        )

        anomalies = data[ data['z'].abs() >= 1.5 ].copy()
        anomalies = anomalies.sort_values('z', key=lambda s: s.abs(), ascending=False).head(20)
        result = anomalies[[ '_id', 'ward', 'zone', 'category', 'realTimeCapacity', 'totalCapacity', 'z' ]].copy()
        result['_id'] = result['_id'].astype(str)
        return jsonify({"bins": result.to_dict(orient='records')}), 200
    except Exception as e:
        print(f"Anomaly error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/ml/priority', methods=['GET'])
def ml_priority():
    try:
        data = _load_bins_df()
        if data.empty:
            return jsonify({"bins": []}), 200

        # Compute hours until full as proxy of urgency
        per_hour = (data['wasteQuantityPerDay'] / 24.0).replace({0.0: 1e-6})
        data['hoursUntilFull'] = (data['totalCapacity'] - data['realTimeCapacity']) / per_hour

        # Status weight
        def status_weight(row):
            # If backend stored status, use it, else derive from ratio
            status = row.get('status')
            if not isinstance(status, str):
                ratio = row['realTimeCapacity'] / max(row['totalCapacity'], 1e-6)
                status = 'filled' if ratio >= 0.85 else ('partially_filled' if ratio >= 0.5 else 'empty')
            return 3 if status == 'filled' else (2 if status == 'partially_filled' else 0)

        data['statusW'] = data.apply(status_weight, axis=1)
        # Sensor absence increases priority slightly (needs manual observation)
        sensor = data.get('sensorEnabled')
        if sensor is None:
            data['sensorBoost'] = 0.5
        else:
            data['sensorBoost'] = (~sensor.astype(bool)).astype(int) * 0.5

        # Lower hoursUntilFull means higher priority -> invert
        max_h = max(float(data['hoursUntilFull'].max()), 1.0)
        data['urgency'] = 1.0 - (data['hoursUntilFull'] / max_h).clip(lower=0.0, upper=1.0)
        data['priorityScore'] = data['statusW'] + data['sensorBoost'] + 2.0 * data['urgency']

        top = data.sort_values('priorityScore', ascending=False).head(20)
        result = top[[ '_id', 'ward', 'zone', 'category', 'realTimeCapacity', 'totalCapacity', 'hoursUntilFull', 'priorityScore' ]].copy()
        result['_id'] = result['_id'].astype(str)
        return jsonify({"bins": result.to_dict(orient='records')}), 200
    except Exception as e:
        print(f"Priority error: {e}")
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)