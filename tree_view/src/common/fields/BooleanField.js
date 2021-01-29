import React, {  useState, useEffect } from 'react';

function BooleanField(props) {
    
    // const [value, setValue] = useState(getInitialValue());



    function handleChange(e){
        props.setValue(e.target.checked)
    }

  

    function handleKeyDown(e){
    
        if(e.nativeEvent.code !== 'Space'){
         
          props.keyDownHandler(e, e.target.checked, true)
        }
       
      }

    return (
        <input 
              ref={props.parentRef}
              readOnly={props.states.readonly}
              label={"Boolean Field"} 
              checked={props.record._values[props.field.name]} 
              onChange={handleChange}
            //   onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              type="checkbox"
              >    
          </input>
       
    )

}

export default BooleanField;