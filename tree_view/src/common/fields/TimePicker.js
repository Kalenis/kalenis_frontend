import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-solid-svg-icons';

const customStyles = {
    menu: (provided, state) => ({
        ...provided,
        borderRadius: '0px',
        marginTop: '0px',
        width: '10em'
    }),

    control: (provided, state) => ({
        ...provided,
        border: '0px',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        

    }),
    menuPortal: (provided, state) => ({
        ...provided,
        left: provided.left - 80,
        zIndex:9999
    }),
    valueContainer: (provided, state) => ({
        display: 'none'



    }),
}

const compactStyles = {
    menu: (provided, state) => ({
        ...provided,
        borderRadius: '0px',
        marginTop: '0px',
        width: '10em'
    }),

    control: (provided, state) => ({
        ...provided,
        border: '0px',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        minHeight:'20px'

    }),
    menuPortal: (provided, state) => ({
        ...provided,
        left: provided.left - 80,
        zIndex:9999
    }),
    valueContainer: (provided, state) => ({
        display: 'none'


    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        // backgroundColor: 'transparent',
        // color:'white'
        height: '20px'
    }),
}

const moment = window.moment

function TimePicker(props) {


    const [options, setOptions] = useState([]);
    const label_format = props.format.includes("A") ? "hh:mm A":"HH:mm"

    useEffect(() => {
        const hours = Array.from({
            length: 48
        }, (_, hour) => moment({
            hour: Math.floor(hour / 2),
            minutes: (hour % 2 === 0 ? 0 : 30)
        })
        );



        let new_options = hours.map(function (hour) {
            
            return { value: hour.format('HH:mm'), label: hour.format(label_format) }
        })
        
        new_options.unshift({ value: now, label: "Now" })
        
        setOptions(new_options)




    }, []);

    function now() {
        
        return moment().format("hh:mm:ss")
    }

    function onChange(value) {
        let time;
        if (typeof value.value === 'function') {
            time = value.value()

        }
        else {
            time = value.value
        }
        
        props.callback(time)

    }

    const DropDown = ({ innerProps, isDisabled }) =>
        !isDisabled ? (
            <div {...innerProps}>
                <FontAwesomeIcon
                    className={props.readonly ? "disabled-icon" : "hoverable-icon"}
                    style={{ marginLeft: '5px' }}
                    icon={faClock} />
            </div>
        ) : null;



    return (

        <Select
            isDisabled={props.readonly}
            styles={props.compact ? compactStyles:customStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
            onChange={onChange}
            filterOption={null}
            options={options}
            components={{DropdownIndicator:DropDown}}
        />



    )
}


export default TimePicker;