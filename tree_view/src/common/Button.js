import React from 'react';

function Button(props) {

    const style = { display: props.states.invisible === true ? 'none' : '', ...props.style } 

    return (
        <input 
          type="button" 
          onClick={props.onClick}
          style={style} 
          className="base-btn" 
          value={props.label} 
          disabled={props.states.readonly ? props.states.readonly : false} />
    );
}

export default Button;