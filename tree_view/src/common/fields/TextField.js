import React, { useState, useContext } from 'react';
import BaseField from './BaseField.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import DropDown from '../../ui/DropDown'
import Paper from '../../ui/surfaces/Paper'


const Sao = window.Sao

function TextField(props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const ref = React.createRef();
  

  
  return (

    <div ref={ref} className="field-with-icon" style={{ width: '100%' }}>

      <BaseField
        value={props.value}
        keyDownHandler={props.keyDownHandler}
        navigate={props.navigate}
        widget={'text'}
        setValue={props.setValue}
        states={props.states}
        parentRef={props.parentRef ? props.parentRef : null}
      />

      <FontAwesomeIcon
        className="hoverable-icon"
        onClick={()=>setDetailOpen(!detailOpen)}
        icon={faInfoCircle}
      />

      <DropDown
       
        width={400}
        ref={ref}
        open={detailOpen}
        onClose={() => { setDetailOpen(false) }}
      >
        <Paper
          className="bg-white px-4 pt-4"
          style={{width:'100%'}}
        >
          {/* <div style={{overflowWrap: 'break-word'}}> */}
            {props.value}
          {/* </div> */}
          {/* <p>{props.value}</p> */}

        </Paper>
      </DropDown>




    </div>



  )
}


export default TextField;