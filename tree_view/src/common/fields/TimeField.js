import React from 'react';
import BaseField from './BaseField.js';
import TimePicker from './TimePicker.js';

const Sao = window.Sao
//use SAO moment
const moment = window.moment


function TimeField(props) {


    function timeToWidget() {

        if (props.value) {
            let label = Sao.common.format_time(props.field.time_format(props.record), props.value)
            return label
        }

    }

    function setWidgetValue() {

        let value = timeToWidget()
        return value;

    }


    function parseTime(value){
        return Sao.common.parse_time(props.field.time_format(props.record), value)
    }

    function setValue(value){
        props.setValue(parseTime(value))
    }

    function getShortchutValue(key){
        
        switch(key){
            case '=': return moment().format("HH:mm:ss");
            case 's': return moment(props.value).add(1, 'seconds').format('HH:mm:ss')
            case 'S': return moment(props.value).subtract(1, 'seconds').format('HH:mm:ss')
            case 'i': return moment(props.value).add(1, 'minutes').format('HH:mm:ss')
            case 'I': return moment(props.value).subtract(1, 'minutes').format('HH:mm:ss')
            case 'h': return moment(props.value).add(1, 'hours').format('HH:mm:ss')
            case 'H': return moment(props.value).subtract(1, 'hours').format('HH:mm:ss')
            default:return false;
        }
    }

    function keyDownHandler(e, value, force_nav, touched){
        let sv = getShortchutValue(e.key)
        if(sv){
            e.preventDefault()
            setValue(sv)
            return;
        }
        return props.keyDownHandler(e, parseTime(value), force_nav, touched)
    }



    return (

        <div className="field-with-icon" style={{ lineHeight: 1, width: '100%' }}>

            <BaseField 
                value={props.value}
                // keyDownHandler={props.keyDownHandler}
                keyDownHandler={keyDownHandler}
                navigate={props.navigate}
                widget={'time'}
                formatValue={setWidgetValue}
                setValue={setValue}
                states={props.states}
                parentRef={props.parentRef ? props.parentRef:null}
             />


            <TimePicker
                callback={setValue}
                readonly={props.states.readonly}
                compact={props.compact}
            />
            


        </div>



    )
}


export default TimeField;