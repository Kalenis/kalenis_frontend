import React, { Component } from 'react';
import M2OField from './M2OField';
import TimeDeltaField from './TimeDeltaField.js';
import LinkField from './LinkField.js';
import BooleanField from './BooleanField.js';
import SelectField from './SelectField.js';
import TextField from './TextField.js';
import BinaryField from './BinaryField.js';
import TimeField from './TimeField.js';
import ReferenceField from './ReferenceField.js';
import Draggable from 'react-draggable';
import BaseField from './BaseField.js';
import DateField from './DateField.js'
import DateTimeField from './DateTimeField.js'
import FloatField from './FloatField.js';
// PROPS
// field: Field Object (temp is the column)
// widget: widget to show


const WithCopyDrag = (props) => {
  return (
    <>

      {props.children}
      {!props.readonly &&
        <Draggable
          axis='y'
          defaultClassName='copyDrag'
          // defaultClassNameDragging='DragHandleActive'
          
          onStop={(event, data) => props.finishDragCopy({
            deltaX: data.x,
            lastX: data.lastX,
            columnIndex: props.columnIndex,
            rowIndex: props.rowIndex,
            value: props.record._values[props.field.name]
          })}
          onDrag={(event, data) => props.startDragCopy({
            deltaX: data.x,
            lastX: data.lastX,
            columnIndex: props.columnIndex,
            rowIndex: props.rowIndex,

          })}
          position={{
            x: 0,
            y: 0
          }}
          zIndex={999}
        >
          <strong>.</strong>
        </Draggable>

      }

    </>
  )


}

const baseFields = ['integer', 'char']


class FieldFactory extends Component {


  constructor(props) {
    super(props);

    this.state = {
      states: {}
    }
    this.setFieldValue = this.setFieldValue.bind(this);
    this.NextLine = this.NextLine.bind(this);
    this.save = this.save.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handleRegularInputKeyDown = this.handleRegularInputKeyDown.bind(this);
    this.pasteArray = this.pasteArray.bind(this);



  }








  //TODO: Refactor
  evalStates() {
    // var state_attrs = this.props.record.expr_eval(this.props.field.description.states || {})
    var new_states = {}
    var state_attrs = this.props.field.get_state_attrs(this.props.record);



    var readonly = this.props.field.description.readonly;
    var required = this.props.field.description.required;

    if (readonly === false) {
      if (state_attrs.readonly !== undefined) {
        readonly = state_attrs.readonly;

      }
    }

    if (required === false) {
      if (state_attrs.required !== undefined) {
        required = state_attrs.required;

      }
    }

    new_states['readonly'] = readonly;
    new_states['required'] = required;
    new_states['invalid'] = state_attrs.invalid
    new_states['invisible'] = state_attrs.invisible ? state_attrs.invisible : false



    this.props.statesCallback(this.props.coord, new_states)

    this.setState({
      states: new_states
    })

  }

  pasteArray(data){
    this.props.pasteArray(this.props.rowIndex, this.props.columnIndex, data)
  }


  setWidget() {

    if (baseFields.includes(this.props.widget)) {
      return (
        <BaseField
          // type='number' 
          widget={this.props.widget}
          states={this.props.cell_state}
          parentRef={this.props.inputRef}
          navigate={this.navigate}
          keyDownHandler={this.handleRegularInputKeyDown}
          navigate_signals={this.props.navigate_signals}
          onEnterPress={this.NextLine}
          field={this.props.field}
          record={this.props.record}
          setValue={this.setFieldValue}
          pasteArray={this.pasteArray}
          value={this.props.record._values[this.props.field.name]}
          compact={this.props.compact} />

      )
    }



    switch (this.props.widget) {

      case 'many2one':
        return (
          <M2OField
            states={this.props.cell_state}
            focusCell={this.props.focusCell}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            field={this.props.field}
            reloadRow={this.props.reloadRow}
            screen={this.props.screen}
            record={this.props.record}
            setValue={this.setFieldValue}
            // value={this.props.record._values[this.props.field.name]} 
            value={this.props.record._values[this.props.field.name.concat('.')] || {}}
            compact={this.props.compact}
          />

        );
        case 'numeric':
          return (
  
            <FloatField
              states={this.props.cell_state}
              parentRef={this.props.inputRef}
              navigate={this.navigate}
              keyDownHandler={this.handleRegularInputKeyDown}
              navigate_signals={this.props.navigate_signals}
              onEnterPress={this.NextLine}
              field={this.props.field}
              record={this.props.record}
              value={this.props.record._values[this.props.field.name]}
              setValue={this.setFieldValue}
              widget={this.props.widget}
              pasteArray={this.pasteArray}
              column={this.props.column} />
  
          )
      case 'float':
        return (

          <FloatField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget}
            pasteArray={this.pasteArray}
            column={this.props.column} />

        )
      case 'date':
        return (

          <DateField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            setValue={this.setFieldValue}
            value={this.props.record._values[this.props.field.name]} />

        )

      case 'timedelta':
        return (

          <TimeDeltaField
            screen={this.props.screen}
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            setValue={this.setFieldValue} />

        )

      case 'time':
        return (

          <TimeField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget}
            compact={this.props.compact} />

        )
      case 'datetime':
        return (

          <DateTimeField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget} />

        )

      case 'url':
        return (
          <LinkField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget} />)

      case 'sip':
        return (
          <LinkField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget} />)

      case 'boolean':
        return (

          <BooleanField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            setValue={this.setFieldValue} />

        )

      case 'selection':
        return (
          <>

            <SelectField
              states={this.props.cell_state}
              parentRef={this.props.inputRef}
              navigate={this.navigate}
              keyDownHandler={this.handleRegularInputKeyDown}
              navigate_signals={this.props.navigate_signals}
              onEnterPress={this.NextLine}
              field={this.props.field}
              record={this.props.record}
              column={this.props.column}
              setValue={this.setFieldValue}
              value={this.props.record._values[this.props.field.name]}
              compact={this.props.compact} />


          </>
        )

      case 'text':
        return (

          <TextField
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            value={this.props.record._values[this.props.field.name]}
            setValue={this.setFieldValue}
            widget={this.props.widget}
            />

        )


      case 'binary':
        return (<BinaryField
          states={this.props.cell_state}
          parentRef={this.props.inputRef}
          navigate={this.navigate}
          keyDownHandler={this.handleRegularInputKeyDown}
          navigate_signals={this.props.navigate_signals}
          onEnterPress={this.NextLine}
          field={this.props.field}
          record={this.props.record}
          setValue={this.setFieldValue} />)
      case 'image':
        return (<BinaryField
          states={this.props.cell_state}
          parentRef={this.props.inputRef}
          navigate={this.navigate}
          keyDownHandler={this.handleRegularInputKeyDown}
          navigate_signals={this.props.navigate_signals}
          onEnterPress={this.NextLine}
          field={this.props.field}
          record={this.props.record}
          setValue={this.setFieldValue}
          preview={true}
          rowHeight={this.props.rowHeight}
        />
        )

      case 'reference':
        return (

          <ReferenceField
            rowIndex={this.props.rowIndex}
            focusCell={this.props.focusCell}
            states={this.props.cell_state}
            parentRef={this.props.inputRef}
            navigate={this.navigate}
            keyDownHandler={this.handleRegularInputKeyDown}
            navigate_signals={this.props.navigate_signals}
            onEnterPress={this.NextLine}
            field={this.props.field}
            record={this.props.record}
            reloadRow={this.props.reloadRow}
            column={this.props.column}
            setValue={this.setFieldValue} />

        )

      case 'one2many':
        return <span>{this.props.record._values.hasOwnProperty(this.props.field.name) ? "(" + this.props.record._values[this.props.field.name].length + ")" : "(0)"}</span>
      case 'many2many':
        return <span>{this.props.record._values.hasOwnProperty(this.props.field.name) ? "(" + this.props.record._values[this.props.field.name].length + ")" : "(0)"}</span>


      default: return 'Not Supported Field' + this.props.widget


    }
  }


  navigate(signal) {

    this.props.navigate(signal)
  }

  //Applied to al "manual" input fields: Checks cursor position before fire navigation
  handleRegularInputKeyDown(e, value, force, noSet, factor) {
    // console.log("Handling regular input")
    // console.log(value)
    if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault()
      this.navigate('ArrowLeft')
      return true
    }

    //handle paste on multiple cells
  //   if(e.metaKey && e.key === 'v'){
  //     // e.persist()
      
  //     e.persist()
  //     e.preventDefault()
  //     navigator.clipboard.readText().then(function(clipText){
          
  //         let clipArray = clipText.split('\n')
  //         if(clipArray && clipArray.length > 1){
            
  //           this.props.pasteArray(this.props.rowIndex, this.props.columnIndex, clipArray)
  //         }
  //         else{
  //           console.log("Text with no array")
  //           console.log(clipText);
  //           // e.metaKey = false;
  //           // this.setFieldValue(clipText, factor)
  //           e.target.value=clipText
            
  //           // return this.handleRegularInputKeyDown(e, clipText, force, noSet, factor);
  //         }
          
  //     }.bind(this))

  // }

    if (e.shiftKey) {
      return true
    }


    if (this.props.navigate_signals.includes(e.key)) {

      if (e.key === 'ArrowDown' || e.key === "ArrowUp") {
        // return this.navigate(e.key);
        e.preventDefault()
        if (!noSet) {
          if (value || value === false || value === null) {
            this.setFieldValue(value, factor)
          }
          //check else condition on timedelta migration to hooks
          else {
            this.setFieldValue(e.target.value, factor)
          }
        }

        if (this.save() != false) {
          return this.navigate(e.key);
        }
      }

      if (force) {
        e.preventDefault()
        return this.navigate(e.key)
      }

      if (e.target.selectionStart === e.target.selectionEnd && e.target.selectionStart === e.target.value.length && e.key === "ArrowRight") {
        return this.navigate(e.key)
      }
      if (e.target.selectionStart === 0 && e.target.selectionEnd === 0 && e.key === "ArrowLeft") {
        return this.navigate(e.key)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        return this.navigate(e.key)
      }





    }

    if (e.key === "Enter") {
      e.preventDefault()
      if (!noSet) {
        if (value || value === false || value === null) {
          this.setFieldValue(value, factor)
        }
        //check else condition on timedelta migration to hooks
        else {
          this.setFieldValue(e.target.value, factor)
        }
      }


      this.NextLine()
    }



  }

  NextLine(e) {
    this.props.field.set_state(this.props.record)
    var valid = this.props.field.validate(this.props.record)
    this.evalStates()

    if (valid && this.props.view_type === 'list_view') {

      if (this.save() != false) {
        this.props.editNext()
      }

    }
    else {
      this.props.editNext()
    }


  }

  save() {

    if(this.props.view_type !== 'list_view'){
      return true;
    }
    console.log("Executing Save");
    var fields = this.props.screen.current_view.get_fields()
    var valid = this.props.record.validate(fields, null, null, true)

    if (valid) {

      this.props.record.save().then(function (res) {

        return res;
      })

    }
    else {
      return false;
    }

    // }

  }

  setFieldValue(value, factor) {

    if (value !== this.props.record._values[this.props.field.name]) {

      if(factor){
        this.props.field.set_client(this.props.record, value, true, factor)  
      }
      else{
        this.props.field.set_client(this.props.record, value, true)
      }
      



      this.props.field.set_state(this.props.record)
      this.props.field.validate(this.props.record)




      this.evalStates()




    }





  }

  render() {

    return (

      <React.Fragment>


        {this.props.cell_state.invisible !== true &&
          <WithCopyDrag
            startDragCopy={this.props.startDragCopy}
            finishDragCopy={this.props.finishDragCopy}
            rowIndex={this.props.rowIndex}
            columnIndex={this.props.columnIndex}
            record={this.props.record}
            field={this.props.field}
            readonly={this.state.states.readonly}
          >
            {this.setWidget()}
          </WithCopyDrag>

        }






      </React.Fragment>
    )
  }
}

export default FieldFactory;