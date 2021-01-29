import React, { useState, useEffect, useReducer } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsAltV } from '@fortawesome/free-solid-svg-icons'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import Button from '../common/Button';
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Modal from '../ui/Modal';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

const Sao = window.Sao;
const SortableContainer = sortableContainer(({ children }) => {
  return <div style={{ maxHeight: '400px', overflow: 'scroll' }} className="cm-sortable-container">{children}</div>;
});


const SortableItem = sortableElement(({ value, remove, index, sortIndex, noRemove }) =>
  <div style={{ color: "black" }} className="cm-sortable-item">
    <DragHandle value={value} />
    {value.type === "field" && !noRemove ?
      <FontAwesomeIcon
        onClick={(e) => { remove(e, sortIndex) }}
        className="cm-sortable-icon cm-sortable-icon-cancel"
        style={{ fontSize: "14px", fontStyle: 'normal' }}
        icon={faTimes} />
      :
      null
    }

  </div>
);



const DragHandle = sortableHandle(({ value }) =>
  <div style={{ flexGrow: 1 }}>
    <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "14px", marginRight: '5px', fontStyle: 'normal' }} icon={faArrowsAltV} />
    {value.attributes.string}
  </div>)


const initialState = {
  ordered_columns: [],
  column_names: [],
  all_fields: {},
  available_fields: {}

}


function ColumnManager(props) {

  const [state, dispatch] = useReducer(reducer, initialState);
  const { ordered_columns, column_names, all_fields, available_fields } = state;

  function reducer(state, action) {

    switch (action.type) {
      case 'SET_COLUMNS':
        let cnames = state.column_names

        if (action.payload.length !== state.ordered_columns.length) {
          cnames = []
          action.payload.forEach(function (column) {

            if (column.attributes) {

              cnames.push(column.attributes.name)

            }

            // return column;

          })
        }
        return { ...state, ordered_columns: action.payload, column_names: cnames };

     
      case 'SET_FIELDS':
        let af = {}
        Object.keys(action.payload).forEach(function (fname) {
          if (!state.column_names.includes(fname)) {
            af[fname] = action.payload[fname]
          }
        })
        return { ...state, all_fields: action.payload, available_fields: af };






    }

  }

  useEffect(() => {

    let columns = [...props.currentColumns]

    if (columns[0].attributes === undefined) {
      columns = columns.slice(1, columns.length)
    }

    dispatch({ type: 'SET_COLUMNS', payload: columns })




  }, []);

  useEffect(() => {

    if (column_names.length) {

      updateFields()
    }




  }, [column_names]);

  function getFields() {
    props.model.execute('fields_get', [], props.session.context, true).then(function (fields) {


      dispatch({ type: 'SET_FIELDS', payload: fields })


    })
  }

  function updateFields() {
    if(!props.access.add_fields){
      return false
    }

    if (!Object.keys(all_fields).length) {


      return getFields()


    }
    else {

      dispatch({ type: 'SET_FIELDS', payload: all_fields })
    }


  }

  const onSortEnd = ({ oldIndex, newIndex }) => {


    dispatch({ type: 'SET_COLUMNS', payload: arrayMove(ordered_columns, oldIndex, newIndex) })

  };

  function setNewColumns() {
    let oc = [...ordered_columns]
    const allColumns = [...ordered_columns]
    oc.map(function (column) {
      //Set width for initially hidden columns
      if (column.attributes.width === 1) {
        column.attributes.width = 100
      }

    })
    props.setColumns(oc, allColumns)
    props.onClose()
  }

  function removeColumn(e, index) {
    let columns = [...ordered_columns]
    columns.splice(index, 1)
    dispatch({ type: 'SET_COLUMNS', payload: columns })
  }

  function addColumn(e, name) {

    let description = {}
    description[name] = all_fields[name]

    //Add field to model
    let added_fields = props.screen.model.add_fields(description)

    let column = {}
    let columns = [...ordered_columns]
    column.field = props.screen.model.fields[name]
    column.model = props.screen.model
    column.type = "field"
    const default_attributes = {
      'width': 200,
      'name': name,
      'create': column.field.description.create,
      'delete': column.field.description.delete,
      'domain': column.field.description.domain,
      'relation': column.field.description.relation,
      'required': column.field.description.required,
      'states': column.field.description.states,
      'widget': column.field.description.type,
      'string': column.field.description.string,
      'sortable': column.field.description.sortable


    }

    column.attributes = default_attributes
    column.sortable = column.field.description.sortable


    columns.unshift(column)


    dispatch({ type: 'SET_COLUMNS', payload: columns })







  }

  return (
    <React.Fragment>
      {ordered_columns.length > 0 &&

        <Modal
          open={props.open}
          paper
          onRequestClose={props.onClose}
          className="px-4 pt-6 pb-6"
          


        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="cm-main">
              {props.access.add_fields &&
                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '3rem', width: '50%' }}>
                  <div className="modal-title">{Sao.i18n.gettext('Available Columns')}</div>

                  <div style={{ maxHeight: '400px', overflow: 'scroll' }} className="cm-sortable-container">
                    {Object.keys(available_fields).map((value, index) => (
                      <div
                        key={value}
                        className="cm-sortable-item">
                        {available_fields[value] ?
                          available_fields[value].string :
                          ""}
                        <FontAwesomeIcon
                          onClick={(e) => { addColumn(e, available_fields[value].name) }}
                          // className="cm-sortable-icon"
                          style={{ color: "rgb(40,80,146)", fontSize: "14px", fontStyle: 'normal' }}
                          icon={faArrowRight} />

                      </div>
                      // <SortableItem disabled={!value.visible} key={`item-${index}`} index={index} sortIndex={index} value={value} setVisibility={this.setVisibility} />
                    ))}
                  </div>






                </div>
              }


              <div style={{ display: 'flex', flexDirection: 'column', width: props.access.add_fields?'50%':'100%' }}>
                <div className="modal-title">{Sao.i18n.gettext('Visible Columns')}</div>

                <SortableContainer hideSortableGhost={true} useDragHandle onSortEnd={onSortEnd}>
                  {ordered_columns.map((value, index) => (
                    <SortableItem
                      key={`item-${index}`}
                      index={index}
                      sortIndex={index}
                      value={value}
                      remove={removeColumn}
                      noRemove={props.noRemove}
                    />
                  ))}
                </SortableContainer>




              </div>


            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '40%', marginTop: '2rem', marginBottom: '2rem', alignSelf: 'flex-end' }}>
              <Button style={{ lineHeight: 1.5, backgroundColor: "#e7e7e7", color: "rgb(40,80,146)" }} onClick={(e) => { props.onClose() }} label={Sao.i18n.gettext('Cancel')} states={{}} />
              <Button style={{ lineHeight: 1.5 }} label={Sao.i18n.gettext('OK')} onClick={setNewColumns} states={{}} />


            </div>
          </div>

        </Modal>
      }
    </React.Fragment>
  )

}




export default ColumnManager;