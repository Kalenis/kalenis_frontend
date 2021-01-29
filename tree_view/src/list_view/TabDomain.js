import React, { useState, useEffect } from 'react';


//TODO: Check if all search_count network request are necesary.

function Tab(props){

    const [counter, setCounter] = useState(0);



    useEffect(() => {


        const getCount= function (){
          
            if(props.active){
               setCounter(props.group_length > 100 ? '99+':props.group_length)
            }
            else{
                
                var screen_domain = props.screen.search_domain(props.screen.screen_container.get_text());
                if (props.tab[2]) {
                    var domain = ['AND', props.tab[1], screen_domain];
                    
                    props.screen.model.execute(
                        'search_count', [domain], props.screen.context)
                        .then(function(count) {
                            if(count > 99){
                                count = '99+'
                            }
                            setCounter(count)
                        }.bind(this));
                }
            }
    
           
        }

        getCount()
      },[props.group_length]); 

      function setActive(e, index){
        if(!props.active){
            props.setActive(props.index)
        }
       
    }

    return( <React.Fragment key={props.tab[0]}>

        <span onClick={(e)=>{setActive(e, props.index)}} className={props.active ? "tab-domain-content tab-domain-active":"tab-domain-content"} >{props.tab[0]}
            
            {/* <sup><span className="badge custom-badge">{props.counters[index] >100? '99+':props.counters[index]}</span></sup> */}
            {props.tab[2] ?  <sup><span className="badge custom-badge">{counter}</span></sup>:""}
           

        </span>
      
        </React.Fragment>)

}

function TabDomain(props) {

   
    // hooks

    //end hooks

    

    

    return (
        <React.Fragment>

            <div className="tab-domain-container">
              
                {props.tabs.map((tab, index) => (
                    
                   <Tab key={tab[0]} 
                   tab={tab} 
                   index={index} 
                   setActive={props.set_active_tab} 
                   active={props.active_tab===index}
                   group_length={props.group.length}
                   screen={props.screen}/>
                ))}
              
            </div>




        </React.Fragment>
    );
}

export default TabDomain;