import React, {  useState, useEffect } from 'react';
import Select from 'react-select';

const customStyles = {
    menu: (provided, state) => ({
      ...provided,
      borderRadius:'0px',
      marginTop:'0px'
    }),

    control: (provided, state) => ({
      // none of react-select's styles are passed to <Control />
      ...provided,
      border:'0px',
      backgroundColor:'transparent',
      boxShadow:'none',

      
      
    }),
    
    menuPortal: (provided, state) => ({
      ...provided,
      zIndex:9999
  }),
  
    
    
  }

  const compactStyles = {
    menu: (provided, state) => ({
      ...provided,
      borderRadius:'0px',
      marginTop:'0px'
    }),

    control: (provided, state) => ({
      // none of react-select's styles are passed to <Control />
      ...provided,
      border:'0px',
      backgroundColor:'transparent',
      boxShadow:'none',
      //compact styles
      minHeight:'20px'
      
      
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      padding:'0px'

  }),
    menuPortal: (provided, state) => ({
      ...provided,
      zIndex:9999
  }),
  // Compact styles
  indicatorsContainer: (provided, state) => ({
    ...provided,
    // backgroundColor: 'transparent',
    // color:'white'
    height: '20px'
}),
    
    
  }

// This keys will be handled by the widget
const widgetKeys = ['ArrowDown', 'ArrowUp', 'Enter']
const Sao = window.Sao

function SelectField(props) {
    
    const [value, setValue] = useState({});
    const [options, setOptions] = useState([])

    useEffect(() => {

        
      //Regular selection field => pre defined options
      if(!options.length){
        if(Array.isArray(props.field.description.selection)) {
        
          let options = formatOptions(props.field.description.selection)
        
          
          if(options.length){
            setOptions(options);
            let value = getValue()
            setValue(value)
          }
          else{
            initSelectionOptions()
          }
          
  
        }
  
        //many2one selection fields => get data

        else if (props.field.description.type === "many2one" || typeof props.field.description.selection === "string"){
          
          initSelectionOptions()
        }
      }
      

        
    }, [props.value]);

    

    

    function initSelectionOptions(){

     var callback = function(selection){
      
      let new_options = formatOptions(selection)
      setOptions(new_options);
      let value = getValue(new_options)
      
      setValue(value)
      
     }
     
    if(!options.length){
      
      
      Sao.common.selection_mixin.init.call(props.column)
      Sao.common.selection_mixin.init_selection.call(props.column, false)
      Sao.common.selection_mixin.update_selection.call(props.column, props.record, props.field, callback)
    }

    else{
      let value = getValue(options)
      setValue(value)
    }
    

     
    }

    //converts received options for use in selection options
    function formatOptions(options){
      return options.map(function(option){
        return {value:option[0], label:option[1]}
      })
    }

    


    function getValue(new_options){
        if(!Array.isArray(props.value)){

          return recordToWidget(props.value, new_options)
        }
        else{
          return recordToWidget(props.value[0], new_options)
        }
      }

    function getSelectedOption(value, new_options){

      if(new_options){
        
        return new_options.filter(function(option){
          return option.value === value

        })[0]
      }
      
      if(Array.isArray(props.field.description.selection)){
        
        return props.field.description.selection.filter(function (option) {

          return option[0] === value
      })[0]

      } else{
        return false;
      }
      

    }

    function recordToWidget(value, new_options){
        
        let widgetValue = getSelectedOption(value, new_options)
        
        
        if(!widgetValue){
           return {value:"", label:""}
        }
        else if(Array.isArray(widgetValue)){
          return {value:widgetValue[0], label:widgetValue[1]}
        }
        else{
          return widgetValue
        }

        
        
        
    }

    function widgetToRecord(value){
        return value.value;
    }

    function handleChange(value){
        
        setValue(value)
        props.setValue(widgetToRecord(value))
    }



    function handleKeyDown(e){

      if(!widgetKeys.includes(e.key)){
        props.keyDownHandler(e, widgetToRecord(value), true, false)
      }
      


    }

    return (
        //override common line height to align widget
        <div style={{lineHeight:1, width:'100%'}}>
           <Select
                ref={props.parentRef ? props.parentRef:null}
                isSearchable
                value={value}
                required={props.states.required}
                isDisabled={props.states.readonly}
                styles={props.compact ? compactStyles:customStyles}
                menuPortalTarget={document.body}
                menuPosition={'fixed'}
                onChange={handleChange}
                options={options}
                onKeyDown={handleKeyDown}
      />
           
        </div>
    )

}

export default SelectField;