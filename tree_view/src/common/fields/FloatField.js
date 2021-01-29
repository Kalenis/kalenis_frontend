import React from 'react';
import BaseField from './BaseField.js';

import {formatNumber, validateNumber} from '../format.js';
const Sao = window.Sao

const navKeys = ["ArrowUp", "ArrowDown", "Enter"]

function FloatField(props) {


    function floatToWidget() {

        if (props.value || props.value === 0) {
            
            let factor = Number(props.column.attributes.factor || 1);
            let digits = props.field.digits(props.record, factor);
           
            
            return formatNumber(props.value, digits, factor)
        }

    }

    function setWidgetValue() {
        

        let value = floatToWidget()

        return value;

    }



    function setValue(value){

        
        props.setValue(validateNumber(value), Number(props.column.attributes.factor || 1))

    }

    function handleKeyDown(e, value, force, noSet){
        
        
       
        
        if(navKeys.includes(e.key)){
            value = validateNumber(value)
        }
        
        return props.keyDownHandler(e, value, force, noSet, Number(props.column.attributes.factor || 1))

    }



    return (

        <div className="field-with-icon" style={{  width: '100%' }}>

            <BaseField 
                value={props.value}
                keyDownHandler={handleKeyDown}
                navigate={props.navigate}
                widget={'float'}
                formatValue={setWidgetValue}
                setValue={setValue}
                states={props.states}
                pasteArray={props.pasteArray}
                parentRef={props.parentRef ? props.parentRef:null}
             />


           
            


        </div>



    )
}


export default FloatField;