import React, {  useState, useEffect } from 'react';


const types = {
    'char':{type:'', validateKey:false, caretPosition:true},
    'float':{type:'', align:'right', validateKey:(key)=>{return /[0-9]|[-]|[.]|[,]|[e]|[E]/.test(key) }, caretPosition:true, formatValue:(value)=>{return parseFloat(value)}},
    'integer':{type:'number', align:'right', validateKey:(key)=>{return /^\d+$/.test(key) }, caretPosition:false},
    'time':{type:'', validateKey:false, caretPosition:true}
}
const Sao = window.Sao;

function BaseField(props) {

    const [fieldType, setFieldType] = useState(types[props.widget])
    const [value, setValue] = useState(getInitialValue());
    const [touched, setTouched] = useState(false)

    function formatValue(value){

        if(props.formatValue){
            return props.formatValue(value)
        }

        if(value === null || value === undefined || value === NaN ){
            return ""
        }
       
        else{
            return value
        }

    }

    function getInitialValue(){

        return formatValue(props.value)
       
    }

    function setInputValue(value){

        setValue(value || "")
    }



    useEffect(() => {

        let propValue = formatValue(props.value)
        
        if(propValue != value){
            
            setValue(propValue)
        }
       
        
    }, [props.value]);





    function handleValueChange(e){

        // setValue(e.target.value);
        setValue(e.target.value)

        if(!touched){
            setTouched(true);
        }
        
    }

    function handleBlur(e){
       

        if(touched){
            props.setValue(e.target.value)
        }
       
    }

   

    function onKeyDown(e){
        
        let force_nav = props.states.required ? true:!fieldType.caretPosition
        // props.keyDownHandler(e, e.target.value, !fieldType.caretPosition, !touched)
        props.keyDownHandler(e, e.target.value, force_nav, !touched)

    }

    function handleKeyPress(e){

        
        if(fieldType.validateKey){
           
           
            if(!fieldType.validateKey(e.key)){
                
                return e.preventDefault()

            }

        }
    }

    function onPaste(e){
        let data = e.clipboardData.getData('text')
        
        if(data){
            let dataArray = data.split('\n')

            if(dataArray.length > 1){
            if(props.pasteArray){
               e.preventDefault()
               dataArray =  dataArray.map(function(row){
                    row = row.split(/\b(\s)/).filter(function(value){
                        value = value.trim()
                        return Boolean(value)
                    }
                        )
                    return row;
                    
                })
                    props.pasteArray(dataArray)
                }
                

            }
            
        }

    }


    return (
        <React.Fragment>
            <input 
            //   label={"Float Field"} 
              ref={props.parentRef}
              readOnly={props.states.readonly}
              required={props.states.required}
              className="field-grid-base"
              value={value} 
              onChange={handleValueChange}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              onKeyPress={handleKeyPress}
              onPaste={onPaste}
              type={fieldType.type}
              style={{textAlign:fieldType.align || 'left'}}
             
              
              >    
          </input>
           
        </React.Fragment>
    )

}

export default BaseField;

