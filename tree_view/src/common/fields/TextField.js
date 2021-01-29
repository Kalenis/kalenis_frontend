import React, { PureComponent } from 'react';

// PROPS
// field: Field Object (temp is the column)
// widget: widget to show
class TextField extends PureComponent {

  constructor(props) {
    super(props);
    // const sortBy = 'index';
    // const sortDirection = SortDirection.ASC;
    // const sortedList = this._sortList({sortBy, sortDirection});

    this.state = {
      value:null
    };

    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  
  }

  handleValueChange(e){
    this.setState({
      value:e.target.value
    })
  }

  handleBlur(e){
    this.props.setValue(e.target.value)
  }

  onKeyDown(e){
    this.props.keyDownHandler(e)
  }

  handleKeyPress(e){
    console.log(e.key)
    
  }

    
    render() {



    
       
        return(

       <React.Fragment>
         <textarea 
              label={"Char Field"} 
              ref={this.props.parentRef}
              readOnly={this.props.states.readonly}
              className="field-grid-base"
              value={this.state.value != null ? this.state.value:this.props.record._values[this.props.field.name]} 
              // placeholder={this.props.field.string}
              onChange={this.handleValueChange}
              onBlur={this.handleBlur}
              onKeyDown={this.onKeyDown}
              >    
          </textarea>
       </React.Fragment>
    )
    }
}

export default TextField;