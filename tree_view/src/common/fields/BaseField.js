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

    function cleanPastedCell(cell) {
        return cell.replace(/[\r\n\t]/g, '').trim()
    }

    function onPaste(e){
        let data = e.clipboardData.getData('text')

        if(!data){
            return
        }

        const hasForbidden = /[\r\n\t]/.test(data)
        const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        let rows = normalized.split('\n')
            .map(function(row){
                return row.trim()
            })
            .filter(function(row){
                return row.length > 0
            })

        if(rows.length > 1 && props.pasteArray){
            e.preventDefault()
            props.pasteArray(rows.map(function(row){
                return row.split('\t').map(cleanPastedCell)
            }))
            return
        }

        if(hasForbidden){
            e.preventDefault()
            const cleaned = cleanPastedCell(rows[0] || data)
            setValue(cleaned)
            setTouched(true)
            props.setValue(cleaned)
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

