import React, { useState, useEffect } from 'react';
import Portal from '../common/Portal.js'
// import useClickOutside from '../common/useClickOutside.js'



const DropDown = React.forwardRef((props, ref) => (

    <div>
        {props.open &&

            <Portal>
                <DropDownP key={'filter_bar'} parent_ref={ref} {...props}>
                    {props.children}
                </DropDownP>

            </Portal>
        }

    </div>



));


function DropDownP(props) {
    const [position, setPosition] = useState({})

    // useClickOutside(props.parent_ref, props.onClose, props.open);


    useEffect(() => {

        const dimensions = props.parent_ref.current.getBoundingClientRect()
        const width = props.width ? props.width: dimensions.width
        let pos = {
            position: 'absolute',
            left: dimensions.left,
            top: dimensions.top + dimensions.height,
            // width: dimensions.width,
            width:width,
            zIndex: '9999'
        }
        setPosition(pos)



    }, [props.parent_ref]);


    // const wrapperRef = React.useRef(null);




    return (
        // <Portal>

        <div {...props} style={position}>
            {props.children}
        </div>

        // </Portal>

    )

}

export default DropDown;
