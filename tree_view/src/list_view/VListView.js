import React, { PureComponent } from 'react';

import { AutoSizer, ScrollSync, Grid, InfiniteLoader, defaultCellRangeRenderer } from "react-virtualized";

import "react-virtualized/styles.css";
import scrollbarSize from 'dom-helpers/util/scrollbarSize';
import styles from '../css/VListStyles.css'
import moment from 'moment';
import { contextMenu } from 'react-contexify';
import ListContextMenu from './ListContextMenu.js';
import { faCloudDownloadAlt } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons';
import { faArrowsAltV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLinesVertical } from '@fortawesome/free-solid-svg-icons';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import copy from 'clipboard-copy';
import Draggable from 'react-draggable';
import FieldFactory from '../common/fields/FieldFactory.js';
import ws from '../common/ws.js';
import ColumnFooter from './ColumnFooter.js';
import Button from '../common/Button.js'
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import _ from 'lodash';
import Modal from '../ui/Modal';

import { formatNumber, validateNumber, validateInput } from '../common/format.js'
const Sao = window.Sao;



const fieldClasses = {
  integer: 'numberCell',
  float: 'numberCell',
  numeric: 'numberCell',
  decimal: 'numberCell',
  char: 'charCell',
  text: 'charCell',
  selection: 'charCell',
  boolean: 'charCell',
  many2one: 'charCell',
  date: 'charCell',
  datetime: 'charCell',
  time: 'charCell',
  timedelta: 'charCell',
  one2many: 'charCell',
  many2many: 'charCell',
  reference: 'charCell',
  progressbar: 'list-progressbar-container',
  button: 'list-button-container',
  image: 'numberCell'
}

const SortableItem = sortableElement(({ children }) => children);
const DragHandle = sortableHandle(({ value, top }) => <div style={{ position: 'absolute', cursor: 'grab', left: '24px', height: '40px', lineHeight: 3.4, zIndex: 9999 }}><FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "14px", marginRight: '5px', marginTop: '5px', fontStyle: 'normal' }} icon={faArrowsAltV} /> </div>)
const SELECTION_NONE = 1;
const SELECTION_SINGLE = 2;
const SELECTION_MULTIPLE = 3;

const minimumBatchSize = 30

const navigate_signals = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Tab'
]

const SortableList = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

class VListView extends PureComponent {



  constructor(props) {
    super(props);


    this.state = {

      height: 1,
      current_height: window.innerHeight,
      overscanColumnCount: 0,
      overscanRowCount: 5,
      rowHeight: props.rowHeight || 40,
      headerHeight: 40,
      // rowCount: 100,
      selected_index: [],
      currentRecord: {},
      loadedRows: [],
      contextOpen: false,
      currentFilter: "",
      loadedMap: {},
      ordered_column: { index: false, order: false },
      hoverColumn: -1,
      hoverRow: -1,
      editedRow: -1,
      editedColumn: -1,
      toogleAll: false,
      columnWidthMap: {},
      column_on_drag: false,
      icons: {},
      field_states: {},
      initialWidthSum: 0,
      loadedColumns: [],
      dragStarted: false,
      dragOrigin: false,
      dragedCells: [],
      copyConfirmationModal: false,
      // recoverScroll:false


    };


    if (this.props.editable) {
      this.renderBodyCell = this.renderEditableBodyCell.bind(this);
    }
    else {
      this.renderBodyCell = this.renderBodyCell.bind(this);
    }

    this.renderLeftHeaderCell = this.renderLeftHeaderCell.bind(this);
    this.renderLeftSideCell = this.renderLeftSideCell.bind(this);
    this.renderHeaderCell = this.renderHeaderCell.bind(this);
    this.renderFooterCell = this.renderFooterCell.bind(this);
    this.getFooter = this.getFooter.bind(this);
    this.sumFooter = this.sumFooter.bind(this);
    this.isRowLoaded = this.isRowLoaded.bind(this);
    this.loadMoreRows = this.loadMoreRows.bind(this);
    this.getColumnWidth = this.getColumnWidth.bind(this);
    this.view_refs = {}
    this._loadMoreRowsStartIndex = 0
    this._loadMoreRowsStopIndex = 1
    this.resetGrid = this.resetGrid.bind(this);
    this.isRowDeleted = this.isRowDeleted.bind(this);
    this.hoverGrid = this.hoverGrid.bind(this);
    this.toogleAll = this.toogleAll.bind(this);
    this.sortValues = this.sortValues.bind(this);
    this.copySingle = this.copySingle.bind(this);
    this.copySelection = this.copySelection.bind(this);
    this.editNextLIne = this.editNextLIne.bind(this);
    this.reloadRow = this.reloadRow.bind(this);
    this.navigateGrid = this.navigateGrid.bind(this);
    this.focusInputCell = this.focusInputCell.bind(this);
    this.getAccess = this.getAccess.bind(this);
    this.createNewLIne = this.createNewLIne.bind(this);
    this.editableRefs = {}
    this.rows_ref = {}
    this.getIcon = this.getIcon.bind(this);
    this.setFieldStates = this.setFieldStates.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.setDragedCells = this.setDragedCells.bind(this);
    this.startDragCopy = this.startDragCopy.bind(this);
    this.finishDragCopy = this.finishDragCopy.bind(this);
    this.getDragCopyValue = this.getDragCopyValue.bind(this);
    this.batchEdit = this.batchEdit.bind(this);
    this.cellRangeRenderer = this.cellRangeRenderer.bind(this);
    this.pasteArray = this.pasteArray.bind(this);
    this.getCellState = this.getCellState.bind(this);
    this.copyToColumn = this.copyToColumn.bind(this);
    this.updateSelectedRecords = this.updateSelectedRecords.bind(this);
    // this.setRecoverScroll = this.setRecoverScroll.bind(this);

  }

  componentWillUnmount() {
    if (this.props.current_view && this.props.current_view.id === 0) {
      this.saveColumnWidth()
    }


  }

  async saveColumnWidth() {


    if (this.state.initialWidthSum != this.getColumnWidthSum()
      || this.props.columns.length !== this.props.allColumns.length) {

      var fields = {}
      Object.keys(this.state.columnWidthMap).map(function (col) {

        //Avoid to use row selection column
        if (col != 0) {

          fields[this.props.columns[col].attributes.name] = this.state.columnWidthMap[col]


        }



      }.bind(this))



      //set to width = 1 all hidden columns
      this.props.allColumns.filter(
        function (col) {

          return col.attributes ? (!(col.attributes.name in fields) && this.props.unique_columns.indexOf(col.attributes.name) === -1) : false

        }.bind(this)).map(function (hColumn) {

          fields[hColumn.attributes.name] = 1
        })



      var model_name = this.props.currentScreen.model_name



      await ws.Post('model.' + 'ir.ui.view_tree_width' + '.set_width', [model_name, fields], this.props.session)



      this.props.session.cache.clear('model.' + model_name + '.fields_view_get')

      if (this.props.type != 'list_view') {
        //if tree view on o2m or m2m2: clear parents view cache
        this.props.session.cache.clear('model.' + this.props.field_instance.model_name + '.fields_view_get')
      }

    }





  }



  componentDidMount() {
    this.props.columns.unshift([])
    this.props.allColumns.unshift([])
    this.setColumnWidth()
    this.props.currentScreen.current_record = null;
    this.props.currentScreen.current_view.set_selected_records([])
    // this.props.currentScreen.limit = 200;
    this.getHeight();


  }



  getHeight = () => {

    let margin = Math.min(250, window.innerHeight * 0.35)
    this.setState({
      height: this.props.type === 'list_view' ? window.innerHeight - margin : this.props.field_instance.attributes.height ? this.props.field_instance.attributes.height : (window.innerHeight * 30) / 100,
      current_height: window.innerHeight
    })
  }


  componentDidUpdate(prevProps) {

    if (window.innerHeight != this.state.current_height) {
      this.getHeight()

    }


    if (this.props.columns != prevProps.columns) {

      if (!Array.isArray(this.props.columns[0])) {
        this.props.columns.unshift([])
      }

      this.setColumnWidth()
      this.view_refs.infinite_loader._registeredChild.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })
      this.view_refs.header_grid.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })

      if (this.props.show_footer) {
        this.view_refs.footer_grid.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })
      }


      let column_names = this.props.columns.map(function (col) { return col.attributes ? col.attributes.name : false })
      column_names.shift()


      if (this.props.columns.length != prevProps.columns.length) {
        this.resetGrid()
      }

    }

    if (this.props.currentScreen.limit != prevProps.currentScreen.limit) {

      this.resetGrid();
    }

    if (this.props.currentScreen.current_record) {
      if (this.props.currentScreen.current_record.id !== this.state.currentRecord.id
        && Object.keys(this.state.currentRecord).length) {
        
        this.setState({
          currentRecord: this.props.currentScreen.current_record
        })
        this.changeSelection(false, this.props.group.indexOf(this.props.currentScreen.current_record), true)

      }


    }







    if (this.props.group != prevProps.group) {

      //#####

      //###
      if (this.shouldReload(prevProps.group)) {

        let focusRecord = prevProps.group.length < this.props.group.length
          && prevProps.group.length > 0
          && this.props.currentScreen.screen_container.get_text() === this.state.currentFilter ? true : false

          let cleanSelection = false

          if(this.state.selected_index){
            
            let prevIds = this.state.selected_index.map(function(i){
              if(!prevProps.group[i]){
                cleanSelection = true;
                return false
              }
              return prevProps.group[i].id
            })
            let currentIds = this.state.selected_index.map(function(i){
              if(!this.props.group[i]){
                cleanSelection = true
                return false
              }
              else{
                return this.props.group[i].id
              }
              
            }.bind(this))
    
            if(!cleanSelection){
              
              prevIds.forEach(function(i){
                if(!currentIds.includes(i)){
                  cleanSelection = true;
                }
              })
            }
          }
          
          
  
  
  
          
  
          
  
          this.resetGrid(focusRecord, cleanSelection)

      }
      else {

        //ScrollSync component fails if scrollTop != 0 on first render
        // TODO: Check edge cases and remove one of the conditions
        if (this._recoverScroll || this.props.currentScreen._recoverScroll) {

          const left = this.view_refs.main_scroll.state.scrollLeft + 0.1
          const top = this.view_refs.main_scroll.state.scrollTop + 0.1

          this.view_refs.infinite_loader._registeredChild.scrollToPosition({ scrollLeft: left, scrollTop: top })

          if (this.props.type === "list_view") {
            this.props.currentScreen._recoverScroll = false
            this._recoverScroll = false
          }
          else {
            //TODO: Check edge cases and improve this condition
            if (!this.props.editable) {
              this.props.currentScreen._recoverScroll = false
              this._recoverScroll = false
            }
          }




        }

      }


    }

    if(this.props.session.context.update_selected){

      this.updateSelectedRecords()
      this.props.session.context.update_selected = false;
    }



  }

  shouldReload(prevGroup) {



    if (this.props.group.length === 0) {
      return false;
    }


    if (prevGroup.length != this.props.group.length) {

      return true;
    }



    else if (prevGroup[0].id != this.props.group[0].id) {

      return true;
    }

    else if (prevGroup[prevGroup.length - 1] != this.props.group[this.props.group.length - 1]) {

      return true;
    }



    else if (this.props.currentScreen.screen_container.get_text() != this.state.currentFilter) {

      return true;
    }
    else {

      return false;
    }




  }

  reloadRow(rowIndex) {



    this.loadMoreRows({ startIndex: rowIndex, stopIndex: rowIndex }).then((response) => {
      this.view_refs.infinite_loader._registeredChild.forceUpdate()


    })

  }


  resetGrid(focusRecord, cleanSelection) {
    let filter_text = this.props.currentScreen.screen_container.get_text()
    let selected_records = []
    // let selected_index = []
    let selected_index = cleanSelection ?[]:[...this.state.selected_index]

    let scrollTo = 0
    
    this.view_refs.infinite_loader.resetLoadMoreRowsCache()


    //5.2: Check if the current view still a KalenisTree
    if (this.props.currentScreen.current_view.view_context) {

      if (focusRecord) {
        selected_index = []
        scrollTo = this.props.group.indexOf(this.props.currentScreen.current_record)

        selected_index.push(scrollTo)

        selected_records.push(this.props.currentScreen.current_record)

      }
      // else {
      //   //set default focus to 0

      //   if (!this.props.editable) {
      //     scrollTo = 0
      //     selected_index.push(scrollTo)
      //     selected_records.push(this.props.group[0])
      //     this.props.currentScreen.current_record = this.props.group[0];
      //     this.props.currentScreen.current_view.set_selected_records(selected_records)
      //   }

      //   else {
      //     if (selected_index.length > 0) {
      //       selected_index.map(function (i) {
      //         selected_records.push(this.props.group[i])
      //       }.bind(this))
      //     }
      //     this.props.currentScreen.current_record = selected_records[this.props.group[selected_index[selected_index.length]]];
      //     this.props.currentScreen.current_view.set_selected_records(selected_records)

      //   }
      //   // this.props.currentScreen.current_view.set_selected_records(selected_records)



      // }

    }

    
    
    this.setState({
      loadedRows: [],
      field_states: {},
      selected_index: selected_index,
      currentFilter: filter_text,
      editedRow: -1,
      editedColumn: -1
    }, () => {
      this.loadMoreRows({ startIndex: 0, stopIndex: minimumBatchSize }).then((response) => {

        if(this.state.selected_index.length > 0){

          
          let records_selection = []
          this.state.selected_index.forEach(function(group_index){
            records_selection.push(this.props.group[group_index])
          }.bind(this))
          
          this.props.currentScreen.current_view.set_selected_records(records_selection)

          //Update current record on SAO when selection is recovered
          this.props.currentScreen.current_record = records_selection[0]
          this.setState({
            currentRecord: records_selection[0]
          })
          
        }

        this.view_refs.infinite_loader._registeredChild.forceUpdate()
        //  if (this._loadMoreRowsStartIndex != 0) {
        var columnIndex = 0;
        if (this.state.ordered_column.index) {
          columnIndex = this.state.ordered_column.index
        }

        if (this.props.editable) {
          if (this.props.group[this.props.group.length - 1].id < 0
            ||
            this.props.group[0].id < 0) {
            //Creating new record

            scrollTo = this.props.group[0].id < 0 ? 0 : this.props.group.length - 1

            this.setState({
              // editedRow: this.props.group[0].id < 0 ? 0:this.props.group.length - 1,
              editedRow: scrollTo,
              editedColumn: 1,
              //avoid to select the new record, just focus
              selected_index: []
            })


            this.props.currentScreen.current_view.set_selected_records([])
            this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: columnIndex, rowIndex: scrollTo - 1 })
            this.focusInputCell(scrollTo, 1)

          }
          else {

            this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: columnIndex, rowIndex: scrollTo })
            this.setState({
              editedRow: scrollTo,
              editedColumn: 1,
              //avoid to select the new record, just focus
              // selected_index: []
            })
            // this.props.currentScreen.current_view.set_selected_records([])
            this.focusInputCell(scrollTo, 1)
          }


        }
        else {



          // this.addCurrentRecord(this.props.group.indexOf(this.props.currentScreen.current_record),this.props.currentScreen.current_record )

          this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: columnIndex, rowIndex: scrollTo })

        }




        // }
      })
    })

  }

  onResizeStop({ columnIndex }) {
    this.setState({
      column_on_drag: false
    })
  }

  resizeColumn({ deltaX, columnIndex, lastX }) {

    let columnWidthMap = { ...this.state.columnWidthMap }

    const new_width = Math.max(50, (columnWidthMap[columnIndex] + (deltaX - lastX)))

    columnWidthMap[columnIndex] = new_width
    this.setState({
      columnWidthMap: columnWidthMap,
      column_on_drag: columnIndex
    }, () => {
      this.view_refs.infinite_loader._registeredChild.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })
      this.view_refs.header_grid.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })
      if (this.props.show_footer) {
        this.view_refs.footer_grid.recomputeGridSize({ columnIndex: 0, rowIndex: 0 })
      }


    })
    this.props.setModified({
      widthMap: columnWidthMap
    })

  }

  renderHeaderCell({ columnIndex, key, rowIndex, style }) {

    if (columnIndex < 1) {
      return;
    }

    let column = this.props.columns[columnIndex]
    const sortable = column.sortable
    let containerClass = "headerCell"
    if (column.type === 'field') {
      let align = fieldClasses[column.attributes.widget] === 'charCell' ? 'column-align-left' : 'column-align-right'
      containerClass = containerClass.concat(' ', align)
    }




    return (
      <div className={containerClass} key={key} style={style}>

        <div className="headerCellContent" style={{ cursor: sortable ? "pointer" : "" }}>

          <span onClick={sortable ? function (e) { this.onColumnClick(e, columnIndex) }.bind(this) : () => { }} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{this.props.columns[columnIndex].attributes.string}</span>
          {sortable &&
            <React.Fragment>
              {this.state.ordered_column.index === columnIndex &&
                <React.Fragment>
                  {this.state.ordered_column.order === false ?
                    <FontAwesomeIcon style={{ paddingLeft: '2px' }} icon={faAngleDoubleDown} /> : <FontAwesomeIcon style={{ paddingLeft: '2px' }} icon={faAngleDoubleUp} />
                  }
                </React.Fragment>

              }

            </React.Fragment>
          }
          <Draggable
            axis='x'
            defaultClassName='DragHandle'
            defaultClassNameDragging='DragHandleActive'

            onStop={(event, data) => this.onResizeStop({

              columnIndex: columnIndex,

            })}

            onDrag={(event, data) => this.resizeColumn({
              deltaX: data.x,
              columnIndex: columnIndex,
              lastX: data.lastX,
            })}
            position={{
              x: 0,
              y: 0
            }}
            zIndex={999}
          >
            <div className='DragHandleIcon'>

              <FontAwesomeIcon icon={faGripLinesVertical} />
            </div>
          </Draggable>

        </div>

        {/* <FontAwesomeIcon style={{ color: "rgb(40,80,146)", marginLeft:'2px' }} icon={faAngleDoubleDown} /> */}


      </div>
    )

    // return this.renderLeftHeaderCell({columnIndex, key, rowIndex, style});
  }

  sumFooter(column) {

    var res = 0
    this.state.selected_index.map(function (row_index) {
      res = res + this.props.group[row_index]._values[column.attributes.name]
    }.bind(this))


    return res
  }

  getFooter(column, operation) {

    var label = column.attributes.sum.concat(":")
    var amount = 0



    switch (operation) {
      case "sum":
        amount = this.sumFooter(column)
        break;
      default:
        amount = -20
        break;
    }

    return label.concat(amount.toString())


  }

  //FooterRender
  renderFooterCell({ columnIndex, key, rowIndex, style }) {


    if (columnIndex < 1) {
      return;
    }

    let column = this.props.columns[columnIndex]
    const sortable = column.sortable
    let containerClass = "headerCell"
    if (column.type === 'field') {
      let align = fieldClasses[column.attributes.widget] === 'charCell' ? 'column-align-left' : 'column-align-right'
      containerClass = containerClass.concat(' ', align)
    }

    return (
      <div className={containerClass} key={key} style={style}>

        <div className="headerCellContent" style={{ cursor: sortable ? "pointer" : "" }}>

          {column.attributes.sum ?
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
              <ColumnFooter
                column={column}
                selected_rows={this.state.selected_index}
                group={this.props.group}
                operation='sum'
                currentScreen={this.props.currentScreen} />
            </span> : ""
          }
          {/* <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>Footer</span>
          
          <Draggable
            axis='x'
            defaultClassName='DragHandle'
            defaultClassNameDragging='DragHandleActive'

            onStop={(event, data) => this.onResizeStop({

              columnIndex: columnIndex,

            })}

            onDrag={(event, data) => this.resizeColumn({
              deltaX: data.x,
              columnIndex: columnIndex,
              lastX: data.lastX,
            })}
            position={{
              x: 0,
              y: 0
            }}
            zIndex={999}
          >
            <div className='DragHandleIcon'>

              <FontAwesomeIcon icon={faGripLinesVertical} />
            </div>
          </Draggable> */}

        </div>

        {/* <FontAwesomeIcon style={{ color: "rgb(40,80,146)", marginLeft:'2px' }} icon={faAngleDoubleDown} /> */}


      </div>
    )

    // return this.renderLeftHeaderCell({columnIndex, key, rowIndex, style});
  }
  //EndFooterRender






  renderLeftHeaderCell({ columnIndex, key, style }) {

    return (

      <div className={"leftCell"} key={key} style={style}>

        <input type="checkbox" style={{ cursor: 'pointer' }} onChange={function (e) { this.toogleAll(e) }.bind(this)} key={key} value={columnIndex} />


      </div>
    );
  }

  //sets only one record as active, cleaning up all selections. used by buttons on tree view.
  addCurrentRecord(record, rowIndex) {

    // let selected_records = [...this.props.currentScreen.current_view.selected_records()]
    // let selected_index = [...this.state.selected_index]
    let selected_records = []
    let selected_index = []

    // var included = selected_index.includes(rowIndex)


    selected_records.push(record)
    selected_index.push(rowIndex)
    this.setState({
      selected_index: selected_index,
      currentRecord: record
    })
    this.props.currentScreen.current_view.set_selected_records(selected_records)


    this.props.currentScreen.current_record = record
    //5.2 set_current_record is not a function anymore
  }

  updateSelectedRecords(){
    if(this.state.selected_index.length === 0){
      return;
    }
    let loadedRows = [...this.state.loadedRows]

    this.state.selected_index.forEach(function(row){
      loadedRows.splice(loadedRows.indexOf(row), 1)
    })
    
    let startIndex = this.state.selected_index[0]
    let stopIndex = this.state.selected_index[this.state.selected_index.length-1]

    
    this.setState({
      loadedRows: loadedRows,
      
    }, () => {
      this.loadMoreRows({ startIndex:startIndex , stopIndex: stopIndex }).then((response) => {
        this.view_refs.infinite_loader._registeredChild.forceUpdate()

      })
    })

  }

  handleCellButton(e, attributes, record, rowIndex) {

    this.addCurrentRecord(record, rowIndex)

    this.props.currentScreen.button(attributes).then(function () {

      let loadedRows = [...this.state.loadedRows]

      loadedRows = [
        ...loadedRows.slice(0, loadedRows.indexOf(rowIndex)),
        ...loadedRows.slice(loadedRows.indexOf(rowIndex) + 1)
      ];
      this.setState({
        loadedRows: loadedRows,
        // currentFilter: filter_text
      }, () => {
        this.loadMoreRows({ startIndex: rowIndex, stopIndex: rowIndex }).then((response) => {
          this.view_refs.infinite_loader._registeredChild.forceUpdate()

        })
      })



      this.view_refs.infinite_loader._registeredChild.forceUpdate()
    }.bind(this));



  }


  formatValue(value, column, key, rowIndex, columnIndex, cell_state) {
    if (cell_state && cell_state.invisible) {
      return ""
    }
    if (column.type === 'button') {
      let states = this.props.group[rowIndex].expr_eval(column.attributes.states || {})


      return (
        <div style={{ height: '70%' }}>
          <Button
            key={key + '_child'}
            onClick={function (e) { this.handleCellButton(e, column.attributes, this.props.group[rowIndex], rowIndex) }.bind(this)}
            states={states}
            label={column.attributes.string}

          />
        </div>

      )
    }

    switch (column.attributes.widget) {

      case 'char': return value;
      case 'numeric': if (value) {
        let digits = column.field.digits(this.props.group[rowIndex])
        let factor = Number(column.attributes.factor || 1);
        return formatNumber(value, digits, factor)

      } break;



      case 'boolean': {
        return (<input type="checkbox" key={key + '_child'} checked={value} readOnly />)
      }
      case 'many2one': {
        // Migration 5.2:changed structure from column.rec_name to the following:
        const column_name = column.attributes.name.concat('.')

        if (this.props.group[rowIndex]._values[column_name] && this.props.group[rowIndex]._values[column_name].rec_name !== undefined) {

          return this.props.group[rowIndex]._values[column_name].rec_name


        }


        else {

          return ""

        }




      }
      case 'date': {

        if (value) {

          var date_format = column.field.date_format(this.props.group[rowIndex]);
          var text = window.Sao.common.format_date(date_format, value);
          return text;

          // return moment(value).format('DD-MM-YYYY') 

        }
        break;

      }
      case 'datetime': {
        if (value) { 
          const df = column.field.date_format(this.props.group[rowIndex]);
          
          const tf = column.field.time_format(this.props.group[rowIndex])
          
          return window.Sao.common.format_datetime(df,tf,this.props.group[rowIndex]._values[column.field.name])
          
        }
      }
      case 'time': {
        // if (value) { return moment(value).format('hh:mm:ss') }
        if (value) {

          return window.Sao.common.format_time(column.field.time_format(this.props.group[rowIndex]), this.props.group[rowIndex]._values[column.field.name])
        }
        break;
      }
      case 'timedelta': {
        if (value) {
          var converter = column.field.converter(this.props.currentScreen);

          return window.Sao.common.timedelta.format(window.Sao.TimeDelta(null, value.asSeconds()), converter);
          // return window.Sao.common.timedelta.format(value) 
        }
        else { return "" }

      }


      case 'integer': { if (_.isInteger(value)) { return parseInt(value) } break; }
      case 'float': {
        if (_.isFinite(value)) {
          let digits = column.field.digits(this.props.group[rowIndex])
          let factor = Number(column.attributes.factor || 1);
          return formatNumber(value, digits, factor)
        }
        break;
      }
      case 'selection': {

        var description = "";


        if (column.field.description.type === 'selection') {
          if (Array.isArray(column.field.description.selection)) {
            column.field.description.selection.forEach(function (item) {
              if (item[0] === value) {
                description = item[1]
                return true;
              }
            })

            return description;

          }

        } else if (column.field.description.type === "many2one") {
          const column_name = column.attributes.name.concat('.')

          if (this.props.group[rowIndex]._values[column_name] && this.props.group[rowIndex]._values[column_name].rec_name != undefined) {

            return this.props.group[rowIndex]._values[column_name].rec_name
          } else {
            return ""
          }
        }




      }
      case "one2many": { if (value) { return "(" + value.length + ")" } break; }
      case "many2many": { if (value) { return "(" + value.length + ")" } break; }
      case 'reference': {

        if (value) {


          var selection = []
          var model_name = "";




          if (Array.isArray(column.field.description.selection)) {

            column.field.description.selection.map(function (pair) {
              if (pair[0] === value[0]) {
                model_name = pair[1]
              }
            })
          }


          return model_name + ',' + this.props.group[rowIndex]._values[column.attributes.name.concat('.')].rec_name
        }
        else { return "" }
      }
      case 'text': {
        if (this.props.editable) {
          return this.formatEditableValue(value, column, key, rowIndex, columnIndex, cell_state)
        }
        else {
          return value
        }

      };
      case 'url': {
        return (
          <div className="field-with-icon">
            <span>{this.props.group[rowIndex]._values[column.attributes.name]}</span>
            <a href={this.props.group[rowIndex]._values[column.attributes.name]}

              target="_blank"><FontAwesomeIcon className="hoverable-icon"
                icon={faExternalLinkAlt}
              />
            </a>
          </div>

        );
      }

      case 'sip': {
        return (
          <div className="field-with-icon">
            <span>{this.props.group[rowIndex]._values[column.attributes.name]}</span>
            <a href={this.props.group[rowIndex]._values[column.attributes.name]}

              target="_blank"><FontAwesomeIcon className="hoverable-icon"
                icon={faPhone}
              />
            </a>
          </div>

        );
      }

      case 'binary': {
        var size;

        if (column.field.get_size) {
          size = column.field.get_size(this.props.group[rowIndex]);
        }
        else {
          size = column.field.get(this.props.group[rowIndex]).length;
        }


        var formatted_size = Sao.common.humanize(size);
        var saveAs = function () {
          var filename;
          var mimetype = 'application/octet-binary';
          var filename_field = this.props.group[rowIndex].model.fields[column.field.description.filename];

          if (filename_field) {
            // filename = filename_field.get_client(this.props.group[rowIndex]);
            filename = this.props.group[rowIndex]._values[column.field.description.filename]
            mimetype = Sao.common.guess_mimetype(filename);
          }
          var prm;
          if (column.field.get_data) {
            prm = column.field.get_data(this.props.group[rowIndex]);
          }

          prm.done(function (data) {
            Sao.common.download_file(data, filename);
          }.bind(this));

        }.bind(this);




        return <div className="field-binary">
          <FontAwesomeIcon style={{ display: size > 0 ? 'inline-block' : 'none' }} onClick={saveAs} className="hoverable-icon" icon={faCloudDownloadAlt} />
          <span>{formatted_size}</span>
        </div>
      }

      case 'progressbar': {
        let percentage = value ? value * 100 : 0
        return (
          <div style={{ marginTop: this.props.list_view_style === 'compact' ? '0.1em' : '' }} className="list-progressbar">
            <div className="list-filled-progressbar" style={{ background: 'linear-gradient(90deg, rgba(36,126,182,0.7) ' + (percentage).toString().concat('%') + ', white 0%)' }}>
              {percentage} %
          </div>
          </div>)
      }
      case 'image': {

        if (value) {
          let blob = new Blob([value]);
          let img_url = window.URL.createObjectURL(blob);
          return (

            <img style={{ maxHeight: this.props.rowHeight - 5 }} src={img_url} />

          )
        }
        return "..."
      }
      default: {
        return "No:" + column.attributes.widget
      }

    }
  }

  getAccess(type) {

    if (this.props.currentScreen.model_name) {
      return Sao.common.MODELACCESS.get(this.props.currentScreen.model_name)[type];
    }
    return true;
  }

  createNewLIne(editedRow) {

    if (this.getAccess('create')) {
      this.props.currentScreen.new_().done(function () {

        this.setState({
          editedRow: editedRow,
          editedColumn: 1
        }, () => { this.focusInputCell(editedRow, 1) })

      }.bind(this))

    }
    else {
      this.setState({
        editedRow: -1,
        editedColumn: -1,
      })
    }




  }

  editNextLIne() {
    var direction = this.props.currentScreen.current_view.attributes.editable
    var editedRow;

    if (direction === 'top') {
      editedRow = this.state.editedRow - 1
      if (editedRow < 0) {
        this.createNewLIne(editedRow + 1)
        return true;
      }

    }

    else {
      editedRow = this.state.editedRow + 1

      if (editedRow >= this.props.group.length) {
        this.createNewLIne(editedRow)
        return true;
      }

    }
    this.setState({
      editedRow: editedRow
    }, () => { this.focusInputCell(editedRow, this.state.editedColumn) })



  }

  navigateGrid(signal) {

    var editedRow = this.state.editedRow
    var editedColumn = this.state.editedColumn
    var originCoord = editedRow.toString().concat(editedColumn.toString())
    switch (signal) {
      case 'ArrowRight':
        editedColumn = editedColumn + 1
        break;
      case 'Tab':
        editedColumn = editedColumn + 1
        break;
      case 'ArrowLeft':
        editedColumn = editedColumn - 1
        break;
      case 'ArrowDown':
        editedRow = editedRow + 1
        break;
      case 'ArrowUp':
        editedRow = editedRow - 1
        break;

    }


    if (editedColumn <= 0 || editedColumn >= this.props.columns.length) {
      return false;
    }

    if (editedRow < 0 || editedRow >= this.props.group.length) {
      return false;
    }

    if (!this.state.loadedRows.includes(editedRow)) {
      this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: editedColumn, rowIndex: editedRow + 10 })
    }
    else {
      this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: editedColumn, rowIndex: editedRow })
    }

    // this.view_refs.infinite_loader._registeredChild.scrollToCell({ columnIndex: editedColumn, rowIndex: editedRow+10 })

    this.setState({
      editedRow: editedRow,
      editedColumn: editedColumn
    }, () => { this.focusInputCell(editedRow, editedColumn, originCoord) })

  }

  focusInputCell(rowIndex, columnIndex, originCoord) {
    if (!rowIndex) {
      rowIndex = this.state.editedRow
    }
    if (!columnIndex) {
      columnIndex = this.state.editedColumn
    }
    var coord = rowIndex.toString().concat(columnIndex.toString())

    if (this.editableRefs[coord]) {
      this.editableRefs[coord].focus()

    }
    // else{
    //   //HERE : REVIEW PENDING: Execute blur if not next coord ?
    //   //skip readonly cells or give them navigation ?
    //   if(originCoord){
    //     this.editableRefs[originCoord].blur()
    //   }
    // }
  }

  startDragCopy({ deltaX, lastX, columnIndex, rowIndex }) {

    this.setState({
      dragStarted: true,
      dragOrigin: { columnIndex: columnIndex, rowIndex: rowIndex }

    })
  }


  batchEdit(positions) {
    
    positions.forEach(function (position) {
      let field = this.props.columns[position.columnIndex].field
      field.set_client(this.props.group[position.rowIndex], position.value, true)


    }.bind(this))


  }

  finishDragCopy({ deltaX, lastX, columnIndex, rowIndex, value }) {

    let dragedCells = [...this.state.dragedCells].map(function (cell) {
      cell.value = value
      return cell
    })


    this.batchEdit(dragedCells)

    this.setState({
      dragStarted: false,
      dragedCells: [],
      dragOrigin: false
    })


  }

  getDragCopyValue(rowIndex, columnIndex) {
    let res = this.state.dragedCells.filter(function (cell) {
      return cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
    })
    if (res.length) {
      return res[0].value
    }
    else { return false }
  }

  isDraged(rowIndex, columnIndex) {

    if (!this.state.dragStarted) {
      return false
    }
    else {
      let res = this.state.dragedCells.filter(function (cell) {
        return cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
      })


      return res.length


    }

  }



  formatEditableValue(value, column, key, rowIndex, columnIndex, cell_state) {

    if (!cell_state) {
      cell_state = {}
    }
    if (column.type === 'button') {
      var states = this.props.group[rowIndex].expr_eval(column.attributes.states || {})

      //invisible
      //readonly
      //icon
      return (<div style={{ height: '70%' }}>
        <Button
          key={key + '_child'}
          onClick={function (e) { this.handleCellButton(e, column.attributes, this.props.group[rowIndex], rowIndex) }.bind(this)}
          states={states}
          label={column.attributes.string}

        />
      </div>)


    }
    else {
      var editRef = (rowIndex).toString().concat(columnIndex.toString())





      return <FieldFactory
        inputRef={(ch) => this.editableRefs[editRef] = ch}
        key={key + '_child'}
        navigate={this.navigateGrid}
        navigate_signals={navigate_signals}
        reloadRow={this.reloadRow}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        column={column}
        field={column.field}
        widget={column.attributes.widget}
        record={this.props.group[rowIndex]}
        editNext={this.editNextLIne}
        screen={this.props.currentScreen}
        view_type={this.props.type}
        focusCell={this.focusInputCell}
        coord={rowIndex.toString().concat(columnIndex.toString())}
        statesCallback={this.setFieldStates}
        cell_state={cell_state}
        startDragCopy={this.startDragCopy}
        finishDragCopy={this.finishDragCopy}
        pasteArray={this.pasteArray}
        rowHeight={this.props.rowHeight}
        compact={this.props.list_view_style === 'compact'}

      />
    }


  }



  //Event Handlers

  onColumnClick(e, columnIndex) {


    const order = !this.state.ordered_column.order
    this.props.currentScreen.current_view.sort_model(this.props.columns[columnIndex], order)
    const ordered = { index: columnIndex, order: order }
    this.setState({
      ordered_column: ordered,
      selected_index:[]
    })
    this.props.setModified({ order: ordered })
    this.props.currentScreen.current_view.set_selected_records([])


  }

  // setRecoverScroll(rowIndex){

  //   this.setState({
  //     recoverScroll:rowIndex
  //   })

  // }

  handleDoubleClick(e, rowIndex) {


    e.preventDefault();
    e.stopPropagation();
    // this.setRecoverScroll(rowIndex)
    this.props.currentScreen.current_record = this.props.group[rowIndex]
    this.props.currentScreen.current_view.set_selected_records([this.props.group[rowIndex]])
    let selected_index = []
    selected_index.push(rowIndex)
    this.setState({
      selected_index: selected_index,
      currentRecord: this.props.group[rowIndex]
    }, () => {
      this.props.currentScreen.row_activate()
      this._recoverScroll = true;
    })


    // this.props.currentScreen._recoverScroll = true;
    // this.changeSelection(e, rowIndex, true);

    // this.props.currentScreen.row_activate();




  }

  handleContextMenu(e, rowIndex, columnIndex) {
    e.preventDefault()

    this.props.currentScreen.current_record = this.props.group[rowIndex]

    this.setState({ contextOpen: true, currentRecord: this.props.group[rowIndex] })
    contextMenu.show({
      id: this.props.parentId + "_contextmenu",
      event: e,
      props: {
        rowIndex,
        columnIndex

      }
    });



  }

  hideContextMenu() {
    contextMenu.hideAll()
    this.setState({ contextOpen: false })
  }

  sortValues(values, rowIndex) {

    let ordered_columns = [...this.props.columns].slice(1, this.props.columns.length).map(function (column) { return column.attributes.name })

    let sortedValues = {}


    ordered_columns.map(function (column) {
      var selected_column = [...this.props.columns].slice(1, this.props.columns.length).filter(function (col) { return col.attributes.name === column })[0]

      if (selected_column.attributes.widget != 'boolean') {
        sortedValues[column] = this.formatValue(values[column], selected_column, rowIndex, rowIndex)
      }
      else {
        sortedValues[column] = values[column]
      }

    }.bind(this))

    return sortedValues;
  }

  copySingle(row, multi) {

    var rowIndex = this.props.group.indexOf(row)
    var row_text = ""
    var TAB = "\t"
    var values = this.sortValues(row._values, rowIndex)
    Object.keys(values).map(function (key) {
      var value = '"'.concat(values[key]).concat('"').concat(TAB)
      row_text = row_text.concat(value)
    })
    if (multi === true) {
      return row_text
    }
    else {
      copy(row_text);
    }

  }



  copySelection() {
    const lineBreak = '\n'
    var lines = ""
    this.state.selected_index.map(function (index) {
      var row = this.copySingle(this.props.group[index], true)
      lines = lines.concat(row).concat(lineBreak)

    }.bind(this))

    copy(lines);
  }

  copyToColumn(direction, rowIndex, columnIndex, action) {
   
    const to_edit = []
    let pending = false;

    
    const value = this.props.group[rowIndex]._values[this.props.columns[columnIndex].attributes.name]
    

    const hasValue = function (row, column){
      const cell_value = this.props.group[row]._values[this.props.columns[column].attributes.name]
      return cell_value !== null && cell_value !== ""
    }.bind(this);

    const addCell = function (row) {
      if(!action){
        
        if(hasValue(row, columnIndex)){
          this.setState({
            copyConfirmationModal:true,
            pendingCopy:{direction:direction,rowIndex:rowIndex, columnIndex:columnIndex,value:value}
          })
          return false;
        }
      }
      
      const cell_state = this.getCellState(row, columnIndex)


      if (!cell_state.readonly && !cell_state.invisible) {
        if(action === 'empty_cells' && hasValue(row, columnIndex)){
          return true;
        }
        to_edit.push({
          rowIndex: row,
          columnIndex: columnIndex,
          value: value
        })

      }
      return true;


    }.bind(this);
    if (direction === 'up') {
      this.props.group.forEach(function (value, index) {
        if (index < rowIndex) {
          // addCell(index)
          if(!addCell(index)){
            pending = true;
            return
          }
        }

      })
    }
    else if (direction === 'down') {
      this.props.group.forEach(function (value, index) {
        if (index > rowIndex) {
          if(!addCell(index)){
            pending = true;
            return
          }

        }

      })
    }

    
    
    if(!pending){
      this.batchEdit(to_edit)
      this.setState({
        pendingCopy:false
      })
    }
    

    //[{rowIndex, columnIndex, value}]


  }

  pasteArray(rowIndex, columnIndex, data) {

    let to_edit = []


    const createValue = function (rowIndex, columnIndex, value) {

      //HERE => validate input vs field type: Currently supported numbers and chars TODO: rest
      value = validateInput[this.props.columns[columnIndex].attributes.widget](value)

      return { rowIndex: rowIndex, columnIndex: columnIndex, value: value }

    }.bind(this)

    data.forEach(function (value, index) {

      if (Array.isArray(value)) {

        value.forEach(function (cellValue, subindex) {
          let column = this.props.columns[columnIndex + subindex]
          let row = this.props.group[rowIndex + index]
          //check if the coords exists
          // if(this.props.group[rowIndex+index] && this.props.columns[columnIndex+subindex]){
          if (row && column) {

            // Check for field states here
            // Write common method to check states. used here and in the renderer

            const cell_state = this.getCellState(rowIndex + index, columnIndex + subindex)

            if (!cell_state.readonly && !cell_state.invisible) {
              to_edit.push(createValue(rowIndex + index, columnIndex + subindex, cellValue))
            }



          }


        }.bind(this))

      }

    }.bind(this))

    this.batchEdit(to_edit)


  }

  toogleAll(e) {
    let selected_records = []
    let selected_index = []

    if (this.state.toogleAll === false) {

      this.props.group.map(function (record) {
        selected_records.push(record)
        selected_index.push(this.props.group.indexOf(record))
      }.bind(this))


    }



    this.props.currentScreen.current_view.set_selected_records(selected_records)
    this.props.currentScreen.current_record = selected_records[0]

    this.setState({
      toogleAll: !this.state.toogleAll,
      selected_index: selected_index
    })


  }

  //rowIndex: Event rowIndex
  //force_single: optional force singleSelection
  changeSelection(e, rowIndex, force_single) {
    var record = this.props.group[rowIndex]
    const setSelection = (selected_index, selected_records) => {
      this.setState({
        selected_index: selected_index,
        currentRecord: record
      })
      this.props.currentScreen.current_record = record
      this.props.currentScreen.current_view.set_selected_records(selected_records)
      this.view_refs.infinite_loader._registeredChild.forceUpdate()
    }

    const singleSelect = () => {
      let selected_index = []
      let selected_records = []

      if (this.state.selected_index.length === 1) {

        if (this.state.selected_index[0] === rowIndex) {
          setSelection(selected_index, selected_records)
          return true
        }

      }
      selected_index.push(rowIndex)
      selected_records.push(record);
      setSelection(selected_index, selected_records)
      return true

    }

    switch (this.props.currentScreen.current_view.selection_mode) {
      case SELECTION_SINGLE: {
        singleSelect()
        break;


      }
      case SELECTION_MULTIPLE: {
        if (!e) {
          return singleSelect()
        }
        if (!e.nativeEvent.shiftKey &&
          !e.nativeEvent.metaKey &&
          !e.nativeEvent.ctrlKey &&
          force_single) {

          return singleSelect()
        }
        // var record = this.props.group[rowIndex]
        let selected_records = [...this.props.currentScreen.current_view.selected_records]
        let selected_index = [...this.state.selected_index]
        var included = selected_index.includes(rowIndex)


        // if (e.target.checked && !included) {
        if (!included) {

          //Shift Range Selection
          if (e.nativeEvent.shiftKey) {

            var pivot;
            if (selected_index.length === 0) {
              pivot = rowIndex
              selected_index.push(rowIndex)
            }
            else {
              pivot = selected_index[selected_index.length - 1]
            }


            var from = pivot < rowIndex ? pivot + 1 : pivot - 1
            var to = pivot < rowIndex ? rowIndex + 1 : rowIndex - 1

            var range = _.range(from, to)

            selected_index = selected_index.concat(range)

            if (pivot > rowIndex) {
              selected_index = selected_index.reverse()
            }

            range.map(function (index) {

              selected_records.push(this.props.group[index])


            }.bind(this))

          }

          else {

            selected_records.push(record)
            selected_index.push(rowIndex)
          }

          //5.2 set_current_record is not a function anymore
          this.props.currentScreen.current_record = record

        }
        else {
          if (included) {
            let to_remove = selected_records.indexOf(record)
            let indexToRemove = selected_index.indexOf(rowIndex)
            selected_records = [
              ...selected_records.slice(0, to_remove),
              ...selected_records.slice(to_remove + 1)
            ];
            selected_index = [
              ...selected_index.slice(0, indexToRemove),
              ...selected_index.slice(indexToRemove + 1)
            ];
            if (this.props.currentScreen.current_record) {
              if (this.props.currentScreen.current_record === record) {

                this.props.currentScreen.current_record = null
              }

              else if (selected_records.length === 0) {

                this.props.currentScreen.current_record = null
              }
            }
          }
        }

        setSelection(selected_index, selected_records)

        return true;
      }
    }


  }

  setDragedCells(rowIndex, columnIndex) {

    //only copy on columns: 
    //TODO: rowCopy
    if (columnIndex !== this.state.dragOrigin.columnIndex) {
      return
    }
    const dragedCells = []
    let rows_to_select = []
    let row_dif = rowIndex - this.state.editedRow

    if (row_dif >= 0) {
      let row_to_select = this.state.editedRow
      while (row_to_select <= rowIndex) {
        rows_to_select.push(row_to_select)
        row_to_select = row_to_select + 1
      }
    }

    if (row_dif < 0) {
      let row_to_select = this.state.editedRow
      while (row_to_select >= rowIndex) {
        rows_to_select.push(row_to_select)
        row_to_select = row_to_select - 1
      }
    }

    rows_to_select.forEach(function (row) {
      dragedCells.push({
        columnIndex: columnIndex,
        rowIndex: row
      })
    })

    this.setState({ dragedCells: dragedCells })

    return true
  }



  hoverGrid(e, rowIndex, columnIndex) {
    if (this._recoverScroll) {
      return true;
    }
    if (this.state.dragStarted) {
      this.setDragedCells(rowIndex, columnIndex)

    }
    //prevent unnecesary renders if the row is in edition mode.
    if (this.state.editedRow !== rowIndex) {
      this.setState({
        hoverColumn: columnIndex,
        hoverRow: rowIndex
      })
      this.view_refs.infinite_loader._registeredChild.forceUpdate()
    }

  }



  //END Event Handlers

  isSelected(rowIndex) {
    return this.state.selected_index.indexOf(rowIndex) > -1
    // return this.props.currentScreen.current_view.selected_records().includes(this.props.group[rowIndex])
  }

  renderBodyCell({ columnIndex, key, rowIndex, style }) {

    var values = this.props.group[rowIndex]._values
    if (columnIndex < 1) {
      return;
    }

    let rowClass

    let column = this.props.columns[columnIndex]

    rowClass = this.isSelected(rowIndex) ? "rowHiglighted" : rowIndex % 2 === 0 ? "TableEvenRow" : "TableOddRow"

    if (this.props.list_view_style === 'compact') {
      rowClass = rowClass.concat(' compact-cell')
    }

    switch (column.type) {
      case 'field': {
        rowClass = rowClass.concat(' ' + fieldClasses[column.attributes.widget])
        break;
      }
      case 'button': {
        rowClass = rowClass.concat(' ' + fieldClasses['button'])
        break;
      }
      default: {
        rowClass = rowClass.concat(' charCell')
        break;
      }
    }

    if (column.attributes.visual) {
      let visual = this.props.group[rowIndex].expr_eval(column.attributes.visual)
      if (visual) {

        rowClass = rowClass.concat(" " + visual)
      }

    }

    if (this.state.hoverRow === rowIndex) {
      rowClass = rowClass.concat(" rowHovered")

    }
    if (this.state.column_on_drag === columnIndex) {
      rowClass = rowClass.concat(" columnOnDrag")
    }

    if (columnIndex === 1 && this.props.drag_sortable) {
      rowClass = rowClass.concat(" lp-15");
    }


    if (this.props.type != 'list_view') {

      if (this.isRowDeleted(rowIndex)) {


        rowClass = rowClass.concat(" rowDeleted")
      }

    }

    if (column.attributes.icon) {


      var icon_value = false;


      if (column.attributes.icon in this.props.group[rowIndex].model.fields) {

        icon_value = this.props.group[rowIndex]._values[column.attributes.icon]
      }
      else { icon_value = column.attributes.icon }

      var icons = { ...this.state.icons }

      var loaded_icon = icons.hasOwnProperty(icon_value)

      if (icon_value && loaded_icon === false) {
        Sao.common.ICONFACTORY.get_icon_url(icon_value).done(function (res_url) {


          var icons = { ...this.state.icons }
          icons[icon_value] = res_url


          this.setState({
            icons: icons
          })
        }.bind(this))
      }


    }



    return (



      <div className={rowClass}
        onDoubleClick={function (e) { this.handleDoubleClick(e, rowIndex) }.bind(this)}
        onContextMenu={function (e) { this.handleContextMenu(e, rowIndex, columnIndex) }.bind(this)}
        onMouseOver={function (e) { this.hoverGrid(e, rowIndex, columnIndex) }.bind(this)}
        onClick={function (e) { this.changeSelection(e, rowIndex, true) }.bind(this)}
        rowindex={rowIndex}
        key={key}
        style={style}>


        {column.attributes.icon ?


          <img className="icon-row" src={this.state.icons[icon_value]} /> : ""

        }

        {this.formatValue(values[this.props.columns[columnIndex].attributes.name], this.props.columns[columnIndex], key, rowIndex, columnIndex)}




      </div>


    )

  }

  getIcon(record, column) {



    var value;


    if (column.attributes.icon in record.model.fields) {

      value = record.model.fields[column.attributes.icon].get_client(record)
    }
    else { value = column.attributes.icon }

    Sao.common.ICONFACTORY.get_icon_url(value).done(function (url) {

      return (<img src={url}></img>)
    })
  }



  setFieldStates(coord, new_states) {
    var field_states = { ...this.state.field_states }
    field_states[coord] = new_states
    this.setState({
      field_states: field_states
    })
  }

  // evalFieldStates(rowIndex, columnIndex){
  //   var coord = rowIndex.toString().concat(columnIndex.toString())
  //   return this.state.invalidCells.indexOf(coord) > 0
  // }

  getCellState(rowIndex, columnIndex) {
    const column = this.props.columns[columnIndex]
    const record = this.props.group[rowIndex]
    let cell_state = {}
    if (column.type === 'button') {
      return cell_state;
    }

    if (column.type === 'field') {
      cell_state = {
        required: column.field.description.required,
        readonly: column.field.description.readonly,
        invisible: column.field.description.invisible
      }

    }


    if (Object.keys(record._values).length) {

      //preset all field states on render time ? Must recheck every event and update from here

      if (column.attributes.states !== "{}") {

        column.field.set_state(record);
        cell_state = column.field.get_state_attrs(record);
      }



    }

    //Here => Review Pending => editable grid is readonly if o2m is, but the form view remains editable
    if (this.props.type !== "list_view" && this.props.field_instance._readonly) {

      if (cell_state) {
        cell_state.readonly = true;
      }
      else {
        cell_state = { readonly: true };
      }


    }

    return cell_state;
  }


  renderEditableBodyCell({ columnIndex, key, rowIndex, style }) {
    var values = this.props.group[rowIndex]._values
    if (columnIndex < 1) {
      return;
    }

    let rowClass

    let column = this.props.columns[columnIndex]

    rowClass = this.isSelected(rowIndex) ? "rowHiglighted" : rowIndex % 2 === 0 ? "TableEvenRow" : "TableOddRow"

    if (this.props.list_view_style === 'compact') {
      rowClass = rowClass.concat(' compact-cell')
    }

    switch (column.type) {
      case 'field': {
        rowClass = rowClass.concat(' ' + fieldClasses[column.attributes.widget])
        break;
      }
      case 'button': {
        rowClass = rowClass.concat(' ' + fieldClasses['button'])
        break;
      }
      default: {
        rowClass = rowClass.concat(' charCell')
        break;
      }
    }

    if (this.state.hoverRow === rowIndex) {
      rowClass = rowClass.concat(" rowHovered")

    }

    if (this.state.column_on_drag === columnIndex) {
      rowClass = rowClass.concat(" columnOnDrag")
    }

    if (this.isDraged(rowIndex, columnIndex)) {
      rowClass = rowClass.concat(" dragedCell")
    }



    if (this.state.editedRow === rowIndex && this.state.editedColumn === columnIndex) {
      rowClass = rowClass.concat(" focusedCell")
    }
    if (columnIndex === 1 && this.props.drag_sortable) {
      rowClass = rowClass.concat(" lp-15");
    }


    const cell_state = this.getCellState(rowIndex, columnIndex)



    // Pending Review
    if (column.type === 'field') {
      if (this.state.editedRow === rowIndex) {
        rowClass = rowClass.concat(" editedRow")

        if (column.field.description.readonly) {
          rowClass = rowClass.concat(" readonlyCell")
        }
        else if (cell_state && cell_state.readonly) {
          rowClass = rowClass.concat(" readonlyCell")
        }
      }
    }


    if (cell_state) {


      if (cell_state.invalid === "required" || cell_state.invalid === "domain") {
        rowClass = rowClass.concat(" invalidCell")
      }


    }



    if (this.props.type != 'list_view') {

      if (this.isRowDeleted(rowIndex)) {

        rowClass = rowClass.concat(" rowDeleted")
      }

    }
    rowClass = rowClass.concat(" editableGrid")

    //icon
    if (column.attributes.icon) {


      var icon_value = false;


      if (column.attributes.icon in this.props.group[rowIndex].model.fields) {

        icon_value = this.props.group[rowIndex]._values[column.attributes.icon]
      }
      else { icon_value = column.attributes.icon }

      var icons = { ...this.state.icons }

      var loaded_icon = icons.hasOwnProperty(icon_value)

      if (icon_value && loaded_icon === false) {
        Sao.common.ICONFACTORY.get_icon_url(icon_value).done(function (res_url) {


          var icons = { ...this.state.icons }
          icons[icon_value] = res_url


          this.setState({
            icons: icons
          })
        }.bind(this))
      }


    }

    return (


      <div className={rowClass}

        //double click is disabled in editable grids
        onDoubleClick={cell_state.readonly ? function (e) { this.handleDoubleClick(e, rowIndex) }.bind(this) : () => { return true }}
        onContextMenu={function (e) { this.handleContextMenu(e, rowIndex, columnIndex) }.bind(this)}
        onMouseOver={function (e) { this.hoverGrid(e, rowIndex, columnIndex) }.bind(this)}
        onClick={function (e) {

          if (this.props.type !== 'list_view') {

            if (!this.props.field_instance._readonly) {


              this.setState({ editedRow: rowIndex, editedColumn: columnIndex }, () => { this.focusInputCell(rowIndex, columnIndex) })

            }
            else {

              return true;

            }



          }

          else {

            this.setState({ editedRow: rowIndex, editedColumn: columnIndex }, () => { this.focusInputCell(rowIndex, columnIndex) })
          }




        }.bind(this)
        }

        key={key} style={style}>


        {column.attributes.icon ?


          <div className="icon-field-container">
            <img className="icon-row" src={this.state.icons[icon_value]} />
            {
              this.state.editedRow === rowIndex
                && !this.props.currentScreen.attributes.readonly
                && !cell_state.readonly ?

                this.formatEditableValue(
                  values[this.props.columns[columnIndex].attributes.name],
                  this.props.columns[columnIndex],
                  key,
                  rowIndex,
                  columnIndex,
                  cell_state
                )
                :
                this.formatValue(
                  values[this.props.columns[columnIndex].attributes.name],
                  this.props.columns[columnIndex],
                  key,
                  rowIndex,
                  columnIndex,
                  cell_state
                )
            }
          </div> :
          <React.Fragment>
            {
              this.state.editedRow === rowIndex &&
                !this.props.currentScreen.attributes.readonly &&
                !cell_state.readonly ?

                this.formatEditableValue(
                  values[this.props.columns[columnIndex].attributes.name],
                  this.props.columns[columnIndex],
                  key,
                  rowIndex,
                  columnIndex,
                  cell_state
                )
                :
                this.formatValue(
                  values[this.props.columns[columnIndex].attributes.name],
                  this.props.columns[columnIndex],
                  key,
                  rowIndex,
                  columnIndex,
                  cell_state
                )
            }
          </React.Fragment>



        }
      </div>


    )

  }

  renderLeftSideCell({ columnIndex, key, rowIndex, style }) {

    let rowClass = this.isSelected(rowIndex) ? "rowHiglighted" : rowIndex % 2 === 0 ? "TableEvenRow" : "TableOddRow"
    rowClass = rowClass.concat(" leftCheckbox")
    if (this.state.hoverRow === rowIndex) {
      rowClass = rowClass.concat(" rowHovered")

    }
    if (this.props.list_view_style === 'compact') {
      rowClass = rowClass.concat(" compact-cell")
    }

    return (
      <div className={rowClass} key={key} style={style}>
        {/* {rowIndex} */}

        <input
          onChange={function (e) { this.changeSelection(e, rowIndex) }.bind(this)}
          type={this.props.currentScreen.current_view.selection_mode === SELECTION_MULTIPLE ? 'checkbox' : this.props.currentScreen.current_view.selection_mode === SELECTION_SINGLE ? 'radio' : 'none'}
          key={key}
          style={{ cursor: 'pointer' }}
          checked={this.isSelected(rowIndex)} />


      </div>
    );
  }


  getColumnWidthSum(columnWidthMap) {

    if (!columnWidthMap) {
      columnWidthMap = { ...this.state.columnWidthMap }

    }
    return Object.values(columnWidthMap).reduce(function (a, b) { return a + b });

  }


  setColumnWidth() {
    let columnWidthMap = {}

    if (this.props.columns.length === this.props.allColumns.length) {
      columnWidthMap = { ...this.state.columnWidthMap }
    }


    this.props.columns.map(function (col, index) {
      columnWidthMap[index] = this.getInitialColumnWidth({ index: index })
    }.bind(this))


    var initialWidthSum;
    if (this.state.initialWidthSum === 0) {
      initialWidthSum = this.getColumnWidthSum(columnWidthMap);
    }
    else {
      initialWidthSum = this.state.initialWidthSum
    }


    this.setState({
      columnWidthMap: columnWidthMap,
      initialWidthSum: initialWidthSum
    })
  }

  getInitialColumnWidth({ index }) {
    if (this.props.columns.length < 2) {
      if (index != 0) {
        return (window.innerWidth) / this.props.columns.length
      }
      else { return 20 }
    }

    else {

      switch (index) {
        case 0:
          return 20;

        default: {
          if (this.props.columns[index].attributes.width) {

            return parseInt(this.props.columns[index].attributes.width)
          }
          else if (this.props.columns[index].type === "button") {
            return 100;
          }
          else {
            return 200;
          }
        }

      }

    }
  }

  //used cause fixed first column(selector) creates problems in real first column render
  getColumnWidth({ index }) {

    if (this.state.columnWidthMap[index]) {
      return this.state.columnWidthMap[index];
    }
    else {
      return 20
    }




  }

  isRowDeleted(index) {


    if (this.props.type === 'o2m') {

      if (this.props.currentScreen && this.props.currentScreen.group[0]) {
        return this.props.currentScreen.group[0].group.record_deleted.includes(this.props.group[index])
      }
    }
    else if (this.props.type === 'm2m') {

      if (this.props.currentScreen && this.props.currentScreen.group[0]) {
        return this.props.currentScreen.group[0].group.record_removed.includes(this.props.group[index])
      }
    }



  }

  //infinite loader methods

  isRowLoading(index) {
    return this.state.loadedMap[index] === 'LOADING'
  }

  isRowLoaded({ index }) {



    return this.state.loadedRows.indexOf(index) > -1

  }

  //must return a promise
  loadMoreRows({ startIndex, stopIndex }) {
    
    if (this.props.group.length === 0) {
      let prm = {
        then: function () {
          return new Promise((resolve, reject) => {
            resolve([])

          })
        }
      }
      return prm;
    }

    this._loadMoreRowsStartIndex = startIndex
    this._loadMoreRowsStopIndex = stopIndex



    let loadedRows = [...this.state.loadedRows]
    for (var i = startIndex; i <= stopIndex; i++) {

      loadedRows.push(i)


    }
    if (loadedRows.length > 0) {
      this.setState({ loadedRows: loadedRows })
    }




    let increment = stopIndex - startIndex + 1;




    let fields = [...this.props.columns]
    fields = fields.slice(1, fields.length);

    return this.props.group[startIndex].loadRange('*', increment, true, fields, this.props.prefixes, this.props.extra_fields).done(function () {

      

    }.bind(this))
  }






  //End IL Methods

  //Range Renderer (DragSortable)

  cellRangeRenderer({
    cellCache, // Temporary cell cache used while scrolling
    cellRenderer, // Cell renderer prop supplied to Grid
    columnSizeAndPositionManager, // @see CellSizeAndPositionManager,
    columnStartIndex, // Index of first column (inclusive) to render
    columnStopIndex, // Index of last column (inclusive) to render
    deferredMeasurementCache,
    horizontalOffsetAdjustment, // Horizontal pixel offset (required for scaling)
    isScrolling, // The Grid is currently being scrolled
    isScrollingOptOut,
    parent, // Grid (or List or Table)
    rowSizeAndPositionManager, // @see CellSizeAndPositionManager,
    rowStartIndex, // Index of first row (inclusive) to render
    rowStopIndex, // Index of last row (inclusive) to render
    scrollLeft, // Current horizontal scroll offset of Grid
    scrollTop, // Current vertical scroll offset of Grid
    styleCache, // Temporary style (size & position) cache used while scrolling
    verticalOffsetAdjustment, // Vertical pixel offset (required for scaling)
    visibleColumnIndices,
    visibleRowIndices,
  }) {


    const renderedCells = [];
    const renderedRows = []

    const areOffsetsAdjusted =
      columnSizeAndPositionManager.areOffsetsAdjusted() ||
      rowSizeAndPositionManager.areOffsetsAdjusted();

    const canCacheStyle = !isScrolling && !areOffsetsAdjusted;

    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {

      let rowDatum = rowSizeAndPositionManager.getSizeAndPositionOfCell(rowIndex);

      let rowStyle = { position: "absolute", top: rowDatum.offset + verticalOffsetAdjustment, height: rowDatum.size, left: 0, right: 0 }

      let rowCells = []



      for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
        let columnDatum = columnSizeAndPositionManager.getSizeAndPositionOfCell(
          columnIndex,
        );
        let isVisible =
          columnIndex >= visibleColumnIndices.start &&
          columnIndex <= visibleColumnIndices.stop &&
          rowIndex >= visibleRowIndices.start &&
          rowIndex <= visibleRowIndices.stop;
        let key = `${rowIndex}-${columnIndex}`;
        let style;

        // Cache style objects so shallow-compare doesn't re-render unnecessarily.
        if (canCacheStyle && styleCache[key]) {

          style = styleCache[key];
        } else {
          // In deferred mode, cells will be initially rendered before we know their size.
          // Don't interfere with CellMeasurer's measurements by setting an invalid size.
          if (
            deferredMeasurementCache &&
            !deferredMeasurementCache.has(rowIndex, columnIndex)
          ) {
            // Position not-yet-measured cells at top/left 0,0,
            // And give them width/height of 'auto' so they can grow larger than the parent Grid if necessary.
            // Positioning them further to the right/bottom influences their measured size.
            style = {
              height: 'auto',
              left: 0,
              position: 'absolute',
              top: 0,
              width: 'auto',
            };
          } else {
            style = {
              height: rowStyle.height,
              left: columnDatum.offset + horizontalOffsetAdjustment,
              position: 'absolute',
              // top: rowStyle.top + verticalOffsetAdjustment,
              width: columnDatum.size,


            };

            styleCache[key] = style;
          }
        }





        let cellRendererParams = {
          columnIndex,
          isScrolling,
          isVisible,
          key,
          parent,
          rowIndex,
          style,
        };

        let renderedCell;

        // Avoid re-creating cells while scrolling.
        // This can lead to the same cell being created many times and can cause performance issues for "heavy" cells.
        // If a scroll is in progress- cache and reuse cells.
        // This cache will be thrown away once scrolling completes.
        // However if we are scaling scroll positions and sizes, we should also avoid caching.
        // This is because the offset changes slightly as scroll position changes and caching leads to stale values.
        // For more info refer to issue #395
        //
        // If isScrollingOptOut is specified, we always cache cells.
        // For more info refer to issue #1028
        if (
          (isScrollingOptOut || isScrolling) &&
          !horizontalOffsetAdjustment &&
          !verticalOffsetAdjustment
        ) {
          if (!cellCache[key]) {
            cellCache[key] = cellRenderer(cellRendererParams);
          }

          renderedCell = cellCache[key];

          // If the user is no longer scrolling, don't cache cells.
          // This makes dynamic cell content difficult for users and would also lead to a heavier memory footprint.
        } else {
          renderedCell = cellRenderer(cellRendererParams);
        }

        if (renderedCell == null || renderedCell === false) {
          continue;
        }

        // Push cell to the row
        rowCells.push(renderedCell);





        //END columns loop
      }
      const rowKey = `${"row"}-${rowIndex}`
      let renderedRow;

      //TODO: add row cache 


      renderedRow = this.rowRenderer({ rowIndex, rowKey, rowCells, rowStyle, isScrolling });
      if (renderedRow == null || renderedRow === false) {
        continue;
      }

      renderedRows.push(renderedRow)




    }



    return renderedRows;
  }

  rowRenderer({ rowIndex, rowKey, rowCells, rowStyle, isScrolling }) {
    let value = parseInt(rowIndex)

    return (
      <SortableItem
        index={value}
        value={value}
        key={rowKey}

        children={

          <div
            style={rowStyle}
            key={rowKey}
          >
            {!isScrolling && <DragHandle value={value} />}
            {rowCells}
          </div>
        }


      >

      </SortableItem>


    )


  }





  onSortEnd = ({ oldIndex, newIndex }) => {

    if (this.props.drag_sortable) {
      arrayMove.mutate(this.props.currentScreen.group, oldIndex, newIndex)
      arrayMove.mutate(this.props.group, oldIndex, newIndex)
      this.props.currentScreen.group.forEach(function (record, index) {

        let pre_sequence = this.props.group[index - 1] ? this.props.group[index - 1]._values[this.props.drag_sortable] : false

        let actual_sequence = record._values[this.props.drag_sortable]

        let post_sequence = this.props.group[index + 1] ? this.props.group[index + 1]._values[this.props.drag_sortable] : false




        // if (index !== record._values[this.props.drag_sortable]) {


        if (pre_sequence && pre_sequence >= actual_sequence) {
          actual_sequence = actual_sequence + 1
          record.field_set_client(this.props.drag_sortable, actual_sequence)
        }
        if (post_sequence && post_sequence <= actual_sequence) {
          post_sequence = actual_sequence + 1
          this.props.group[index + 1].field_set_client(this.props.drag_sortable, post_sequence);
        }

        if (actual_sequence === null) {

          record.field_set_client(this.props.drag_sortable, index)
        }





        // }


      }.bind(this))



    };

  }



  render() {

    const {
      // columnCount,

      height,
      overscanColumnCount,
      overscanRowCount,
      // headerHeight

    } = this.state;

    const rowHeight = this.props.rowHeight
    const headerHeight = this.props.rowHeight

    const columnCount = this.props.columns.length
    var rowCount = this.props.group.length

    return (
      <React.Fragment>
        <ScrollSync ref={main_scroll => { this.view_refs['main_scroll'] = main_scroll; }}>
          {({
            clientHeight,
            clientWidth,
            onScroll,
            scrollHeight,
            scrollLeft,
            scrollTop,
            scrollWidth,
          }) => {
            // const x = scrollLeft / (scrollWidth - clientWidth);
            // const y = scrollTop / (scrollHeight - clientHeight);


            // const leftColor = 'red';






            return (
              <div className="GridRow">


                {this.props.actions.relationActions != [] &&

                  <ListContextMenu
                    screen={this.props.currentScreen}
                    id={this.props.parentId + "_contextmenu"}
                    actions={this.props.actions}
                    currentSession={this.props.session}
                    copySingle={this.copySingle}
                    copySelection={this.copySelection}
                    contextOpen={this.state.contextOpen}
                    hideContextMenu={this.hideContextMenu}
                    editable={this.props.editable}
                    copyToColumn={this.copyToColumn} />
                }
                <div
                  className="LeftSideGridContainer"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    display: this.props.currentScreen.current_view.selection_mode === SELECTION_MULTIPLE ? 'inline' : 'none',

                  }}>
                  <Grid
                    cellRenderer={this.renderLeftHeaderCell}
                    // className="HeaderGrid"
                    width={20}
                    height={headerHeight}
                    rowHeight={headerHeight}
                    // columnWidth={this.getColumnWidth}
                    columnWidth={this.getColumnWidth}
                    rowCount={1}
                    columnCount={1}
                  />
                </div>
                <div
                  className={"LeftSideGridContainer"}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: headerHeight,
                    // color: leftColor,


                  }}>
                  <Grid
                    overscanColumnCount={overscanColumnCount}
                    overscanRowCount={overscanRowCount}
                    cellRenderer={(columnIndex, key, rowIndex, style) => this.renderLeftSideCell(columnIndex, key, rowIndex, style)}
                    columnWidth={this.getColumnWidth}
                    // columnWidth={20}
                    columnCount={1}
                    className={"LeftSideGrid"}
                    height={height - scrollbarSize()}
                    rowHeight={rowHeight}
                    rowCount={rowCount}
                    scrollTop={scrollTop}
                    width={20}
                  />
                </div>


                <div className="GridColumn">

                  <AutoSizer ref={main_autosizer => { this.view_refs['main_autosizer'] = main_autosizer; }} disableHeight>

                    {({ width }) => (


                      <div>
                        <div
                          style={{

                            height: headerHeight,

                          }}>
                          <Grid
                            className="HeaderGrid"
                            columnWidth={this.getColumnWidth}
                            ref={header_grid => { this.view_refs['header_grid'] = header_grid; }}
                            columnCount={columnCount}
                            height={headerHeight}
                            overscanColumnCount={overscanColumnCount}
                            cellRenderer={(columnIndex, key, rowIndex, style) => this.renderHeaderCell(columnIndex, key, rowIndex, style)}
                            rowHeight={headerHeight}
                            rowCount={1}
                            scrollLeft={scrollLeft}

                            width={process.env.NODE_ENV === 'test' ? 900 : width}

                          />
                        </div>


                        <div
                          style={{
                            // backgroundColor: 'yellow',
                            color: "black",
                            height: height,
                            // width,



                          }}>

                          <InfiniteLoader
                            isRowLoaded={this.isRowLoaded}
                            loadMoreRows={this.loadMoreRows}
                            rowCount={this.props.group.length}
                            ref={infinite_loader => { this.view_refs['infinite_loader'] = infinite_loader; }}
                            minimumBatchSize={minimumBatchSize}
                            threshold={30}
                          >
                            {({ onRowsRendered, registerChild }) => (
                              <SortableList
                                lockToContainerEdges
                                lockAxis="y"
                                hideSortableGhost={true}
                                useDragHandle
                                onSortEnd={this.onSortEnd}>

                                <Grid
                                  className="BodyGrid"
                                  ref={registerChild}
                                  columnWidth={this.getColumnWidth}
                                  columnCount={columnCount}
                                  height={height}
                                  onScroll={onScroll}
                                  onSectionRendered={({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }) => {
                                    
                                    onRowsRendered({
                                      startIndex: rowStartIndex,
                                      stopIndex: rowStopIndex,
                                    })
                                  }}
                                  overscanColumnCount={overscanColumnCount}
                                  overscanRowCount={overscanRowCount}
                                  cellRenderer={(columnIndex, key, rowIndex, style) => this.renderBodyCell(columnIndex, key, rowIndex, style)}
                                  rowHeight={rowHeight}
                                  rowCount={rowCount}
                                  width={process.env.NODE_ENV === 'test' ? 900 : width}
                                  cellRangeRenderer={this.props.drag_sortable ? this.cellRangeRenderer : defaultCellRangeRenderer}
                                // cellRangeRenderer={this.cellRangeRenderer}



                                />

                              </SortableList>


                            )}



                          </InfiniteLoader>




                        </div>

                        {/* //Footers */}
                        {this.props.show_footer ?
                          <div
                            style={{

                              height: rowHeight,

                            }}>
                            <Grid
                              className="HeaderGrid"
                              columnWidth={this.getColumnWidth}
                              ref={footer_grid => { this.view_refs['footer_grid'] = footer_grid; }}
                              columnCount={columnCount}
                              height={rowHeight}
                              overscanColumnCount={overscanColumnCount}
                              cellRenderer={(columnIndex, key, rowIndex, style) => this.renderFooterCell(columnIndex, key, rowIndex, style)}
                              rowHeight={rowHeight}
                              rowCount={1}
                              scrollLeft={scrollLeft}
                              width={process.env.NODE_ENV === 'test' ? 900 : width}

                            />
                          </div> : ""

                        }


                        {/* //end footers */}

                      </div>



                    )}



                  </AutoSizer>


                </div>


              </div>
            );
          }}
        </ScrollSync>
        <Modal
          open={this.state.copyConfirmationModal}
          paper
          onRequestClose={() => { this.setState({ copyConfirmationModal: false }) }}
          className="px-4 pt-6"
        // target={props.root_element}
        >
          <div className="modal-title" style={{ paddingLeft: '0px' }}> {Sao.i18n.gettext('Warning')}</div>
          <div style={{ marginTop: '1rem' }}>
          <p>{window.Sao.i18n.gettext('There are cells with values in the column')}</p>
          </div>
         
          <div className="pt-6" style={{ display: 'flex', marginBottom:'1rem' }}>
            <Button
              style={{ lineHeight: 1.5, backgroundColor: "#e7e7e7", color: "rgb(40,80,146)", marginRight:'5px' }}
              onClick={() => { this.setState({ copyConfirmationModal: false }) }}
              states={{}}
              label={window.Sao.i18n.gettext('Cancel')}
            />
            <Button
              style={{ lineHeight: 1.5, backgroundColor: '#e7e7e7', color:'red', marginRight:'5px' }}
              onClick={function (e) { 
                const copyInfo = this.state.pendingCopy;
                this.copyToColumn(copyInfo.direction, copyInfo.rowIndex,copyInfo.columnIndex, 'replace_all') 
                this.setState({ copyConfirmationModal: false })
              }.bind(this)}
              states={{}}
              label={window.Sao.i18n.gettext('Replace All')}
            />
            <Button
              style={{ lineHeight: 1.5 }}
              onClick={function (e) { 
                const copyInfo = this.state.pendingCopy;
                this.copyToColumn(copyInfo.direction, copyInfo.rowIndex,copyInfo.columnIndex, 'empty_cells') 
                this.setState({ copyConfirmationModal: false })
              }.bind(this)}
              states={{}}
              label={window.Sao.i18n.gettext('Write only empty cells')}
            />
          </div>

        </Modal>
      </React.Fragment>
    );
  }
}

export default VListView;


