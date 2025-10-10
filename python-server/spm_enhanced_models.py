"""
SPM AI/ML Enhanced Models for EcoTrack Waste Management System
Demonstrates advanced AI/ML concepts in Software Project Management
"""

import pandas as pd
import numpy as np
from pymongo import MongoClient
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

# Deep Learning (if available)
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, LSTM, Dropout
    from tensorflow.keras.optimizers import Adam
    DEEP_LEARNING_AVAILABLE = True
except ImportError:
    DEEP_LEARNING_AVAILABLE = False
    print("TensorFlow not available. Deep learning features disabled.")

# NLP Libraries (if available)
try:
    from transformers import pipeline, AutoTokenizer, AutoModel
    import torch
    NLP_AVAILABLE = True
except ImportError:
    NLP_AVAILABLE = False
    print("Transformers not available. NLP features disabled.")

app = Flask(__name__)
CORS(app)

# Database connection
client = MongoClient("mongodb://localhost:27017/waste-management")
db = client["waste-management"]
wastebins_collection = db["wastebins"]
reports_collection = db["userreports"]
users_collection = db["users"]

class SPMEnhancedModels:
    """
    Enhanced ML models demonstrating SPM AI/ML concepts
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.load_data()
    
    def load_data(self):
        """Load and preprocess data from MongoDB"""
        try:
            # Load waste bins data
            bins_data = list(wastebins_collection.find())
            self.bins_df = pd.DataFrame(bins_data)
            
            # Load reports data
            reports_data = list(reports_collection.find())
            self.reports_df = pd.DataFrame(reports_data)
            
            # Load users data
            users_data = list(users_collection.find())
            self.users_df = pd.DataFrame(users_data)
            
            self.preprocess_data()
            print("Data loaded successfully")
            
        except Exception as e:
            print(f"Error loading data: {e}")
            self.bins_df = pd.DataFrame()
            self.reports_df = pd.DataFrame()
            self.users_df = pd.DataFrame()
    
    def preprocess_data(self):
        """Preprocess data for ML models"""
        if self.bins_df.empty:
            return
        
        # Clean and normalize waste bins data
        self.bins_df['wasteQuantityPerDay'] = pd.to_numeric(
            self.bins_df['wasteQuantityPerDay'].astype(str).str.replace(' tonnes', ''), 
            errors='coerce'
        ).fillna(0.0)
        
        self.bins_df['totalCapacity'] = pd.to_numeric(
            self.bins_df['totalCapacity'], errors='coerce'
        ).fillna(0.0)
        
        self.bins_df['realTimeCapacity'] = pd.to_numeric(
            self.bins_df['realTimeCapacity'], errors='coerce'
        ).fillna(0.0)
        
        # Calculate derived features
        self.bins_df['capacity_ratio'] = self.bins_df['realTimeCapacity'] / self.bins_df['totalCapacity']
        self.bins_df['remaining_capacity'] = self.bins_df['totalCapacity'] - self.bins_df['realTimeCapacity']
        self.bins_df['fill_rate'] = self.bins_df['wasteQuantityPerDay'] / 24.0  # per hour
        
        # Status classification
        self.bins_df['status'] = self.bins_df['capacity_ratio'].apply(
            lambda x: 'filled' if x >= 0.8 else ('partially_filled' if x >= 0.3 else 'empty')
        )
        
        print("Data preprocessing completed")
    
    # 1. PROJECT PLANNING & ESTIMATION
    def train_effort_estimation_model(self):
        """
        SPM Category 1: Project Planning & Estimation
        ML Regression Models for predicting project effort & cost
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for effort estimation
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Target: estimated collection time (hours)
        y = (self.bins_df['remaining_capacity'] / (self.bins_df['fill_rate'] + 1e-6)).fillna(0)
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train multiple models
        models = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42)
        }
        
        results = {}
        for name, model in models.items():
            if name == 'Linear Regression':
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
            
            mse = mean_squared_error(y_test, y_pred)
            results[name] = {
                'mse': mse,
                'rmse': np.sqrt(mse),
                'predictions': y_pred.tolist()[:10]  # First 10 predictions
            }
        
        # Store the best model
        best_model = min(results.keys(), key=lambda x: results[x]['mse'])
        self.models['effort_estimation'] = models[best_model]
        self.scalers['effort_estimation'] = scaler
        
        return {
            'best_model': best_model,
            'results': results,
            'feature_importance': dict(zip(features, self.models['effort_estimation'].feature_importances_)) if hasattr(self.models['effort_estimation'], 'feature_importances_') else None
        }
    
    # 2. SCHEDULING & RESOURCE ALLOCATION
    def train_resource_allocation_model(self):
        """
        SPM Category 2: Scheduling & Resource Allocation
        ML models for optimizing resource allocation
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for resource allocation
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Target: priority score (higher = more urgent)
        y = self.bins_df['capacity_ratio'] * 3 + (1 - self.bins_df['capacity_ratio']) * 2
        
        # Train classification model for priority levels
        priority_levels = pd.cut(y, bins=3, labels=['low', 'medium', 'high'])
        
        X_train, X_test, y_train, y_test = train_test_split(X, priority_levels, test_size=0.2, random_state=42)
        
        # Train models
        models = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'SVM': SVC(random_state=42),
            'Logistic Regression': LogisticRegression(random_state=42)
        }
        
        results = {}
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            results[name] = {
                'accuracy': accuracy,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
        
        # Store the best model
        best_model = max(results.keys(), key=lambda x: results[x]['accuracy'])
        self.models['resource_allocation'] = models[best_model]
        
        return {
            'best_model': best_model,
            'results': results
        }
    
    # 3. RISK MANAGEMENT
    def train_risk_assessment_model(self):
        """
        SPM Category 3: Risk Management
        ML Classification Models for predicting project risks
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for risk assessment
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Risk factors: high capacity ratio + high waste quantity = high risk
        risk_score = self.bins_df['capacity_ratio'] * 0.6 + (self.bins_df['wasteQuantityPerDay'] / 10) * 0.4
        risk_levels = pd.cut(risk_score, bins=3, labels=['low_risk', 'medium_risk', 'high_risk'])
        
        X_train, X_test, y_train, y_test = train_test_split(X, risk_levels, test_size=0.2, random_state=42)
        
        # Train models
        models = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42),
            'SVM': SVC(random_state=42)
        }
        
        results = {}
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            results[name] = {
                'accuracy': accuracy,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
        
        # Store the best model
        best_model = max(results.keys(), key=lambda x: results[x]['accuracy'])
        self.models['risk_assessment'] = models[best_model]
        
        return {
            'best_model': best_model,
            'results': results
        }
    
    # 4. QUALITY MANAGEMENT
    def train_quality_prediction_model(self):
        """
        SPM Category 4: Quality Management
        ML models for predicting quality issues
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for quality prediction
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Quality issues: bins that are consistently full or have high waste quantity
        quality_score = self.bins_df['capacity_ratio'] * 0.7 + (self.bins_df['wasteQuantityPerDay'] / 5) * 0.3
        quality_levels = pd.cut(quality_score, bins=3, labels=['good', 'fair', 'poor'])
        
        X_train, X_test, y_train, y_test = train_test_split(X, quality_levels, test_size=0.2, random_state=42)
        
        # Train models
        models = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42)
        }
        
        results = {}
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            results[name] = {
                'accuracy': accuracy,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
        
        # Store the best model
        best_model = max(results.keys(), key=lambda x: results[x]['accuracy'])
        self.models['quality_prediction'] = models[best_model]
        
        return {
            'best_model': best_model,
            'results': results
        }
    
    # 5. MONITORING & CONTROL
    def train_anomaly_detection_model(self):
        """
        SPM Category 6: Monitoring & Control
        Anomaly Detection for identifying unusual patterns
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for anomaly detection
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Use Isolation Forest for anomaly detection
        from sklearn.ensemble import IsolationForest
        
        # Train Isolation Forest
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        anomaly_labels = iso_forest.fit_predict(X)
        
        # Calculate anomaly scores
        anomaly_scores = iso_forest.decision_function(X)
        
        # Identify anomalies
        anomalies = self.bins_df[anomaly_labels == -1].copy()
        anomalies['anomaly_score'] = anomaly_scores[anomaly_labels == -1]
        
        self.models['anomaly_detection'] = iso_forest
        
        return {
            'total_anomalies': len(anomalies),
            'anomaly_percentage': (len(anomalies) / len(self.bins_df)) * 100,
            'anomalies': anomalies[['_id', 'ward', 'zone', 'capacity_ratio', 'anomaly_score']].to_dict('records')[:10]
        }
    
    # 6. DEEP LEARNING MODELS (if available)
    def train_deep_learning_model(self):
        """
        SPM Category: Advanced ML
        Deep Learning models for complex pattern recognition
        """
        if not DEEP_LEARNING_AVAILABLE:
            return {"error": "Deep learning libraries not available"}
        
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Prepare data for LSTM
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0).values
        
        # Target: capacity ratio (for time series prediction)
        y = self.bins_df['capacity_ratio'].fillna(0).values
        
        # Reshape for LSTM (samples, timesteps, features)
        # For demonstration, we'll use a simple approach
        X_reshaped = X.reshape(X.shape[0], 1, X.shape[1])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X_reshaped, y, test_size=0.2, random_state=42)
        
        # Build LSTM model
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
        
        # Train model
        history = model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2, verbose=0)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        
        self.models['deep_learning'] = model
        
        return {
            'model_type': 'LSTM',
            'mse': float(mse),
            'training_history': {
                'loss': history.history['loss'][-1],
                'val_loss': history.history['val_loss'][-1]
            }
        }
    
    # 7. CLUSTERING FOR PATTERN ANALYSIS
    def perform_clustering_analysis(self):
        """
        SPM Category: Data Analysis
        Clustering for identifying patterns in waste management
        """
        if self.bins_df.empty:
            return {"error": "No data available"}
        
        # Features for clustering
        features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
        X = self.bins_df[features].fillna(0)
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Perform K-means clustering
        kmeans = KMeans(n_clusters=3, random_state=42)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Add cluster labels to dataframe
        self.bins_df['cluster'] = clusters
        
        # Analyze clusters
        cluster_analysis = {}
        for i in range(3):
            cluster_data = self.bins_df[self.bins_df['cluster'] == i]
            cluster_analysis[f'cluster_{i}'] = {
                'count': len(cluster_data),
                'avg_capacity_ratio': cluster_data['capacity_ratio'].mean(),
                'avg_waste_quantity': cluster_data['wasteQuantityPerDay'].mean(),
                'common_status': cluster_data['status'].mode().iloc[0] if not cluster_data.empty else 'unknown'
            }
        
        self.models['clustering'] = kmeans
        self.scalers['clustering'] = scaler
        
        return {
            'clusters': cluster_analysis,
            'silhouette_score': None  # Could be calculated if needed
        }

# Initialize the enhanced models
spm_models = SPMEnhancedModels()

# API Endpoints
@app.route('/spm/effort-estimation', methods=['GET', 'POST'])
def effort_estimation():
    """SPM Category 1: Project Planning & Estimation"""
    if request.method == 'POST':
        # Train the model
        result = spm_models.train_effort_estimation_model()
        return jsonify(result)
    else:
        # Get predictions
        if 'effort_estimation' in spm_models.models:
            # Make predictions for all bins
            features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
            X = spm_models.bins_df[features].fillna(0)
            predictions = spm_models.models['effort_estimation'].predict(X)
            
            result = spm_models.bins_df[['_id', 'ward', 'zone']].copy()
            result['estimated_effort_hours'] = predictions
            result['_id'] = result['_id'].astype(str)
            
            return jsonify({"predictions": result.to_dict('records')})
        else:
            return jsonify({"error": "Model not trained yet"})

@app.route('/spm/resource-allocation', methods=['GET', 'POST'])
def resource_allocation():
    """SPM Category 2: Scheduling & Resource Allocation"""
    if request.method == 'POST':
        result = spm_models.train_resource_allocation_model()
        return jsonify(result)
    else:
        if 'resource_allocation' in spm_models.models:
            features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
            X = spm_models.bins_df[features].fillna(0)
            priorities = spm_models.models['resource_allocation'].predict(X)
            
            result = spm_models.bins_df[['_id', 'ward', 'zone']].copy()
            result['priority_level'] = priorities
            result['_id'] = result['_id'].astype(str)
            
            return jsonify({"allocations": result.to_dict('records')})
        else:
            return jsonify({"error": "Model not trained yet"})

@app.route('/spm/risk-assessment', methods=['GET', 'POST'])
def risk_assessment():
    """SPM Category 3: Risk Management"""
    if request.method == 'POST':
        result = spm_models.train_risk_assessment_model()
        return jsonify(result)
    else:
        if 'risk_assessment' in spm_models.models:
            features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
            X = spm_models.bins_df[features].fillna(0)
            risks = spm_models.models['risk_assessment'].predict(X)
            
            result = spm_models.bins_df[['_id', 'ward', 'zone']].copy()
            result['risk_level'] = risks
            result['_id'] = result['_id'].astype(str)
            
            return jsonify({"risks": result.to_dict('records')})
        else:
            return jsonify({"error": "Model not trained yet"})

@app.route('/spm/quality-prediction', methods=['GET', 'POST'])
def quality_prediction():
    """SPM Category 4: Quality Management"""
    if request.method == 'POST':
        result = spm_models.train_quality_prediction_model()
        return jsonify(result)
    else:
        if 'quality_prediction' in spm_models.models:
            features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
            X = spm_models.bins_df[features].fillna(0)
            qualities = spm_models.models['quality_prediction'].predict(X)
            
            result = spm_models.bins_df[['_id', 'ward', 'zone']].copy()
            result['quality_level'] = qualities
            result['_id'] = result['_id'].astype(str)
            
            return jsonify({"qualities": result.to_dict('records')})
        else:
            return jsonify({"error": "Model not trained yet"})

@app.route('/spm/anomaly-detection', methods=['GET', 'POST'])
def anomaly_detection():
    """SPM Category 6: Monitoring & Control"""
    if request.method == 'POST':
        result = spm_models.train_anomaly_detection_model()
        return jsonify(result)
    else:
        if 'anomaly_detection' in spm_models.models:
            features = ['totalCapacity', 'realTimeCapacity', 'wasteQuantityPerDay', 'capacity_ratio']
            X = spm_models.bins_df[features].fillna(0)
            anomalies = spm_models.models['anomaly_detection'].predict(X)
            
            result = spm_models.bins_df[['_id', 'ward', 'zone']].copy()
            result['is_anomaly'] = (anomalies == -1).astype(int)
            result['_id'] = result['_id'].astype(str)
            
            return jsonify({"anomalies": result[result['is_anomaly'] == 1].to_dict('records')})
        else:
            return jsonify({"error": "Model not trained yet"})

@app.route('/spm/deep-learning', methods=['GET', 'POST'])
def deep_learning():
    """SPM Category: Advanced ML - Deep Learning"""
    if request.method == 'POST':
        result = spm_models.train_deep_learning_model()
        return jsonify(result)
    else:
        return jsonify({"error": "Deep learning model training required"})

@app.route('/spm/clustering', methods=['GET', 'POST'])
def clustering():
    """SPM Category: Data Analysis - Clustering"""
    if request.method == 'POST':
        result = spm_models.perform_clustering_analysis()
        return jsonify(result)
    else:
        if 'clustering' in spm_models.models:
            result = spm_models.bins_df[['_id', 'ward', 'zone', 'cluster']].copy()
            result['_id'] = result['_id'].astype(str)
            return jsonify({"clusters": result.to_dict('records')})
        else:
            return jsonify({"error": "Clustering not performed yet"})

@app.route('/spm/models/status', methods=['GET'])
def models_status():
    """Get status of all trained models"""
    return jsonify({
        "trained_models": list(spm_models.models.keys()),
        "available_scalers": list(spm_models.scalers.keys()),
        "data_status": {
            "bins_count": len(spm_models.bins_df),
            "reports_count": len(spm_models.reports_df),
            "users_count": len(spm_models.users_df)
        },
        "deep_learning_available": DEEP_LEARNING_AVAILABLE,
        "nlp_available": NLP_AVAILABLE
    })

@app.route('/spm/models/train-all', methods=['POST'])
def train_all_models():
    """Train all SPM models at once"""
    results = {}
    
    try:
        results['effort_estimation'] = spm_models.train_effort_estimation_model()
        results['resource_allocation'] = spm_models.train_resource_allocation_model()
        results['risk_assessment'] = spm_models.train_risk_assessment_model()
        results['quality_prediction'] = spm_models.train_quality_prediction_model()
        results['anomaly_detection'] = spm_models.train_anomaly_detection_model()
        results['clustering'] = spm_models.perform_clustering_analysis()
        
        if DEEP_LEARNING_AVAILABLE:
            results['deep_learning'] = spm_models.train_deep_learning_model()
        
        return jsonify({
            "status": "success",
            "message": "All models trained successfully",
            "results": results
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "results": results
        })

if __name__ == '__main__':
    print("🚀 Starting SPM Enhanced ML Server...")
    print("📊 Available SPM AI/ML Categories:")
    print("   1. Project Planning & Estimation")
    print("   2. Scheduling & Resource Allocation")
    print("   3. Risk Management")
    print("   4. Quality Management")
    print("   6. Monitoring & Control")
    print("   + Advanced ML (Deep Learning, Clustering)")
    print("\n🔗 API Endpoints:")
    print("   POST /spm/models/train-all - Train all models")
    print("   GET  /spm/models/status - Check model status")
    print("   POST /spm/effort-estimation - Train effort estimation model")
    print("   GET  /spm/effort-estimation - Get effort predictions")
    print("   POST /spm/resource-allocation - Train resource allocation model")
    print("   GET  /spm/resource-allocation - Get resource allocations")
    print("   POST /spm/risk-assessment - Train risk assessment model")
    print("   GET  /spm/risk-assessment - Get risk assessments")
    print("   POST /spm/quality-prediction - Train quality prediction model")
    print("   GET  /spm/quality-prediction - Get quality predictions")
    print("   POST /spm/anomaly-detection - Train anomaly detection model")
    print("   GET  /spm/anomaly-detection - Get anomalies")
    print("   POST /spm/deep-learning - Train deep learning model")
    print("   POST /spm/clustering - Perform clustering analysis")
    print("   GET  /spm/clustering - Get clustering results")
    
    app.run(debug=True, port=5001)
