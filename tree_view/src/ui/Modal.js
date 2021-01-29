import React  from 'react';
import Portal from '../common/Portal.js'
import Paper from './surfaces/Paper.js';
// import useClickOutside from '../common/useClickOutside.js';



function Modal(props) {
    // const width = 150


    const style = {
        position:'absolute',
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        // backgroundColor       : 'transparent',
        // border                : 'none'
    }
    // useClickOutside(content_ref, props.onClose, props.open)


    return (
        <>
            {props.open &&
                <Portal target={props.target ? props.target:false}>
                    <div className="absolute bg-modal-background inset-0">
                        {props.paper ?
                            <Paper className={props.className} style={style} >
                                {props.children}
                            </Paper>
                        :
                            <div className={props.className} style={style}>{props.children}</div>
                        }
                       


                    </div>



                </Portal>
            }
        </>


    )

}
export default Modal;