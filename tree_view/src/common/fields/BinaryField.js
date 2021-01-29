import React, { PureComponent } from 'react';

// PROPS
// field: Field Object (temp is the column)
// widget: widget to show
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faCloudDownloadAlt } from '@fortawesome/free-solid-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faSearch } from '@fortawesome/free-solid-svg-icons'



const Sao = window.Sao;
class BinaryField extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      value: null,
      filter_text: false,

    }

    this.saveAs = this.saveAs.bind(this)
    this.clearField = this.clearField.bind(this);
    this.getFilenameField = this.getFilenameField.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);


  }






  getSize(human_readable) {
    var size;
    var res;
    if (this.props.field.get_size) {
      size = this.props.field.get_size(this.props.record);
    }
    else {
      size = this.props.field.get(this.props.record).length;
    }

    if (human_readable) {
      res = Sao.common.humanize(size);
    }
    else {
      res = size
    }

    return res;


  }

  getFilenameField() {
    return this.props.record.model.fields[this.props.field.description.filename];
  }

  saveAs() {
    var filename;
    var mimetype = 'application/octet-binary';
    var filename_field = this.getFilenameField()
    if (filename_field) {

      filename = this.props.record._values[this.props.field.description.filename]
      mimetype = Sao.common.guess_mimetype(filename);
    }
    var prm;
    if (this.props.field.get_data) {
      prm = this.props.field.get_data(this.props.record);
    }


    prm.done(function (data) {
      Sao.common.download_file(data, filename);
    }.bind(this));

  }

  clearField() {

    this.props.field.set_client(this.props.record, null);
    var filename_field = this.getFilenameField();
    if (filename_field) {
      filename_field.set_client(this.props.record, null);
    }

  }

   onKeyDown(e){
    
    this.props.keyDownHandler(e, e.target.value, true, true)

}

  onChangeInput(e) {
    e.stopPropagation();
    e.preventDefault();
    var file = e.target.files[0];

    var callback = function (value, name) {
      this.props.field.set_client(this.props.record, value);
      if (this.getFilenameField()) {
        this.getFilenameField().set_client(this.props.record, name);
      }
    }.bind(this);

    Sao.common.get_file_data(file, callback);



  }

  selectFile() {
    this.upload.click()
  }

  getPreview() {
   
    
    if(this.props.record._values[this.props.field.name]){
      let blob = new Blob([this.props.record._values[this.props.field.name]]);
      return window.URL.createObjectURL(blob);
    }
    else{
      return false;
    }
    

  }


  render() {

    return (

      <React.Fragment>

        {this.props.preview &&
          <div onKeyDown={this.onKeyDown} tabIndex="0" ref={this.props.parentRef} className="field-with-preview">
            <React.Fragment>
            <img style={{ height: this.props.rowHeight - 5 }} src={this.getPreview()}></img>
            <input
              style={{ display: "none" }}
              type='file'
              accept="image/*"
              onChange={this.onChangeInput}
              ref={(ref) => this.upload = ref}

            />
            <div style={{alignSelf:'center', position:'absolute', right:0, top:0, height:'100%'}} className="field-binary-vcontrols">
              
              <FontAwesomeIcon style={{marginLeft:'3px',marginBottom:'3px', display: this.getSize(false) > 0 ? 'inline-block' : 'none' }} className="hoverable-icon" onClick={this.clearField} icon={faTimes} />
              <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'inline-block' : 'none' }} className="hoverable-icon" onClick={this.saveAs} icon={faCloudDownloadAlt} />
              <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'none' : 'inline-block' }} className="hoverable-icon" onClick={this.selectFile} icon={faSearch} />
            </div>
            </React.Fragment>
          </div>
         

        }
        {!this.props.preview &&
          <div onKeyDown={this.onKeyDown} tabIndex="0" ref={this.props.parentRef} className="field-with-icon">



            <React.Fragment>
              <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'inline-block' : 'none' }} className="hoverable-icon" onClick={this.saveAs} icon={faCloudDownloadAlt} />
              <input

                style={{ display: "none" }}
                type='file'
                onChange={this.onChangeInput}
                ref={(ref) => this.upload = ref}

              >
              </input>


              <span>{this.getSize(true)}</span>


              <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'inline-block' : 'none' }} className="hoverable-icon" onClick={this.clearField} icon={faTimes} />
              <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'none' : 'inline-block' }} className="hoverable-icon" onClick={this.selectFile} icon={faSearch} />
            </React.Fragment>

          </div>
        }




      </React.Fragment>
    )
  }
}

export default BinaryField;