import React from 'react';

import { Menu, Item, Submenu } from 'react-contexify';
import Calendar from 'react-calendar';


function CalendarPicker(props) {

    // const [value, setValue] = useState();

    function onChange(date) {
       
        props.callback(date)
        // setValue(date)
    }

    return (

        <Menu style={{padding:0}} onClick={(e) => { return e.stopPropagation() }} tabindex="0" id={props.id} className="autocomplete-menu">
           
            <Item className="calendar-item" disabled style={{opacity:1, padding:0}}>
                <Calendar
                    onChange={onChange}
                    onViewChange={onChange}
                    locale={window.moment.locale()}
                    value={props.value ? props.value:new Date()}
                    
                />
            </Item>
           


        </Menu>



    )
}


export default CalendarPicker;