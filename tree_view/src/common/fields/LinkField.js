import React from 'react';
import BaseField from './BaseField.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faPhone } from '@fortawesome/free-solid-svg-icons';

const Sao = window.Sao

function LinkField(props) {


  

    function setValue(value){
        props.setValue(value)
    }



    return (

        <div className="field-with-icon" style={{  width: '100%' }}>
            
            <BaseField 
                value={props.value}
                keyDownHandler={props.keyDownHandler}
                navigate={props.navigate}
                widget={'time'}
                // formatValue={setWidgetValue}
                setValue={setValue}
                states={props.states}
                parentRef={props.parentRef ? props.parentRef:null}
             />
             <a  href={props.value} target="_blank">
              <FontAwesomeIcon className="hoverable-icon" icon={props.widget === 'url' ? faExternalLinkAlt:faPhone} />
            </a>

          
        </div>



    )
}


export default LinkField;