import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { contextMenu } from 'react-contexify';
import CalendarPicker from './CalendarPicker.js';


//use SAO moment
const moment = window.moment



function DateField(props) {

    const [inputValue, setInputValue] = useState("");
    const [dateValue, setDateValue] = useState("")
    const [calendarOpen, setCalendarOpen] = useState(false);

    
    useEffect(() => {

        if(!props.value){
            if(dateValue){
                setInputValue(formatInputValue(props.value))
                setDateValue(formatDateValue(props.value))
            }
        }
        else{
            if(!moment(dateValue).isSame(props.value)){
                setInputValue(formatInputValue(props.value))
                setDateValue(formatDateValue(props.value))
            }
        }
        
       
       
       
        
    }, [props.value]);


    function getDateFormat(){
        return props.field.date_format(props.record)
    }

    function getDateFromString(string_date){
        if(!string_date){
            return null;
        }
        return moment(string_date, getDateFormat())
    }


    //Format Input Value

    function formatInputValue(date) {
      
        if (!date) {
            return ""
        }
        

        var date_format = getDateFormat();
        
        var value = window.Sao.common.format_date(date_format, date);

        return value

    }

    // Format Date Object for the calendar
    function formatDateValue(value){
       
        if(!value){
            return false

        }

        else{
            
            return moment(value).toDate()
        }

    }


    function setValue(value){

       
        let date;

        
        if(!value){

            date=null
        }
        else{
            date = moment(value)
            // date = value
        }
        
      
        setInputValue(formatInputValue(date))
        if(date){
            date.isDate = true;
        }
        

        props.setValue(date)


        setDateValue(formatDateValue(date))

    }
    


    function calendarCallback(date){
        
        setValue(date)
        contextMenu.hideAll()
        setCalendarOpen(false);

    }

    function handleValueChange(e) {
     
        setInputValue(e.target.value)
    }

    function shouldUpdate(value){

        if(!value){
          
            if(!dateValue){
                return false
            }
            else{
                return true
            }
        }

        else{
            return !moment(dateValue).isSame( getDateFromString(value))
        }

    }

    function handleBlur(e) {

       

        if(shouldUpdate(e.target.value)){
            setValue(getDateFromString(e.target.value))
        }

   


    }


    function getShortchutValue(key){
        switch(key){
            case '=': return moment()
            case 'd': return moment(dateValue).add(1, 'days')
            case 'D': return moment(dateValue).subtract(1, 'days')
            case 'm': return moment(dateValue).add(1, 'months')
            case 'M': return moment(dateValue).subtract(1, 'months')
            case 'y': return moment(dateValue).add(1, 'years')
            case 'Y': return moment(dateValue).subtract(1, 'years')
            default:return false;
        }
    }


    function handleKeyDown(e) {
     
       let set_value = !shouldUpdate(e.target.value)
       
        
       let sv = getShortchutValue(e.key)
       
       if(sv){
            e.preventDefault()
            setValue(sv)
            return;
       }
    

       props.keyDownHandler(e, getDateFromString(e.target.value), false, set_value)
    }

    function openCalendar(e){

        if (!props.states.readonly) {

        setCalendarOpen(true);
       
        contextMenu.show({
            id: props.field.name + "_picker",
            event: e,

          });

        }
    }

   





    return (

        <div style={{ backgroundColor: props.states.readonly === true ? "rgba(234,234,234,0.8)" : '' }} className="field-with-icon">
            <input
                ref={props.referenceChild ? false : props.parentRef}
                readOnly={props.states.readonly}
                required={props.states.required}
                value={inputValue}
                onChange={handleValueChange}
                onBlur={handleBlur}
                // onKeyPress={this.handleKeyPress}
                onKeyDown={handleKeyDown}
                className="field-grid-base field-m2o-input"
                // style={{ border: this.props.states.invalid === "required" ? "1px solid red" : "" }}
            >
            </input>

            <FontAwesomeIcon onClick={openCalendar} className={props.states.readonly ? "disabled-icon" : "hoverable-icon"} icon={faCalendarAlt} />
            {/* {calendarOpen && */}
            <CalendarPicker id={props.field.name + "_picker"} callback={calendarCallback} value={dateValue} />
            {/* } */}
            

        </div>



    )
}


export default DateField;