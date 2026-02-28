import React from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../assets/logo.png';

const Logo = ({ className = "" }) => {
    return (
        <Link to="/dashboard" className={`group flex items-center justify-center gap-3 md:gap-[15px] ${className}`}>
            <div className="relative shrink-0 flex items-center justify-center h-full pt-[2px]">
                <img
                    src={logoUrl}
                    alt="Chill Dude Logo"
                    className="h-10 md:h-[50px] w-auto object-contain object-center transition-transform duration-200 hover:scale-105"
                />
            </div>
            <span className="font-bold text-[28px] md:text-[32px] leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 m-0 p-0 block mt-[4px]">
                Chill Dude
            </span>
        </Link>
    );
};

export default Logo;
