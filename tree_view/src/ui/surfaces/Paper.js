import React from 'react';


function Paper(props) {

    const classNames = " bg-white shadow-xl"

    return (

        <div 
            className={props.className ? props.className.concat(classNames):classNames}
            style={props.style || {}}
           
        >
            {props.children}
        </div>

    )

}

export default Paper;