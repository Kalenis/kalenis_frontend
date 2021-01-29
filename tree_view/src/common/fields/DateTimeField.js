import React from 'react';
import DateField from './DateField.js'
import TimeField from './TimeField.js'


function DateTimeField(props) {


    return (

        <div  className="field-with-icon" style={{ lineHeight: 1, width: '100%' }}>
       
        <DateField
            states={props.states}
            // parentRef={props.parentRef}
            navigate={props.navigate}
            keyDownHandler={props.keyDownHandler}
            onEnterPress={props.onEnterPress}
            field={props.field}
            record={props.record}
            setValue={props.setValue}
            value={props.value} />
        <span style={{marginRight:"5px", marginLeft:'5px'}} className=" css-1okebmr-indicatorSeparator"></span>
        <TimeField
            states={props.states}
            // parentRef={props.parentRef}
            navigate={props.navigate}
            keyDownHandler={props.keyDownHandler}
            onEnterPress={props.onEnterPress}
            field={props.field}
            record={props.record}
            setValue={props.setValue}
            value={props.value}
            widget={props.widget} />
            


        </div>



    )
}


export default DateTimeField;