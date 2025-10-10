import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
// import './userMainNavigation.css';
import Navbar from './Navbar';
import Footer from './Footer';
import Map from '../pages/map/Map';
import SlideUpPanel from './SlideUpPanel';

const UserMainNavigation = () => {
    return(
        <>
        <Navbar/>
        <div className="h-[calc(100vh-4rem)]">
            <Map/>
        </div>
        {/* <SlideUpPanel/> */}
        {/* <Footer/> */}
        </>
    );
};

export default UserMainNavigation;



