
const Sao = window.Sao;


//Format Methods: Show data on client
export const formatNumber = (value, digits, factor) => {
    let options = {}
    let lang = Sao.i18n.BC47(Sao.i18n.getlang())
    if(Sao.i18n.locale){
        if(Sao.i18n.locale.decimal_point === '.'){
            lang = 'en'
        }
    }
    
    

    if(digits){
        options.minimumFractionDigits = digits[1]
        options.maximumFractionDigits = digits[1]
        
    }
    else{
        options.maximumFractionDigits = 20
    }
    
    return parseFloat(value*factor).toLocaleString(lang, options);
}

//Write Methods: Set data to backend
export const validateNumber = (value) => {
    
    value = value.replace(',','.')
    return parseFloat(value);
}

export const validateInput =  {
    'integer':validateNumber,
    'float':validateNumber,
    'numeric':validateNumber,
    'char': (value) => {return value}
}

const formatter = {
    formatNumber,
    validateNumber,
    validateInput
}


export default formatter;