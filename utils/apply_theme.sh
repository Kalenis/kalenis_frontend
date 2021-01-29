#!/bin/sh
cd ..

if test -f "sao/index.html"; then
    rm sao/index.html
fi

if test -f "sao/custom.css"; then
    rm sao/custom.css
fi

if test -f "sao/custom.js"; then
    rm sao/custom.js
fi


# theme=default
# emulator @$1 -theme $theme

echo "Requested Theme: $1"




if [ "$1" != "" ]; then
    theme="$1"



    if ! [ -d "theme/$1" ]; then
        echo "---------------------------------------------------"
        echo "The theme $1 does not exist, default theme applied"
        echo "---------------------------------------------------"
        theme=default
    else


    if ! [ -f "theme/$1/index.html" ]; then
        echo "---------------------------------------------------"
        echo "No index.html file found on theme/$1, default theme applied"
        echo "---------------------------------------------------"
        theme=default
    fi
fi




else
    echo "No theme supplied, setting default"
    theme=default
fi





cd sao

ln -s ../theme/$theme/custom.css 
ln -s ../theme/$theme/index.html 
ln -s ../theme/$theme/custom.js




cd images

if ! [ -d "../../theme/$1/img" ]; then
        echo "---------------------------------------------------"
        echo "No custom images found"
        echo "---------------------------------------------------"
        ln -s -f ../original_images/* .

else
    echo "Adding Custom images from theme " $theme
    ln -s -f ../../theme/$theme/img/* .
fi


echo "-------------$theme Theme Applied-------------------"
