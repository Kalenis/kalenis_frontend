import ReactDOM from 'react-dom'





const Portal = props => {
    
    // let user_view_list = document.createElement('div')
    // user_view_list.id = user_view_list_id

    let mount = document.getElementById("main");
    if(props.target){
      mount = document.getElementById(props.target)
    }

    
    if(!mount){
       
        return null;
    }

    return ReactDOM.createPortal(
        props.children,
        mount,
    
    );
  };

  export default Portal;