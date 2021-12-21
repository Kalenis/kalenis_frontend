#!/bin/sh
# V6.0
cd ..

if [ -d "./sao" ]; then
    echo "Removing old sao"
    rm -r ./sao
    
fi

echo "Downloading SAO"
# hg clone https://hg.tryton.org/sao/ 
git clone https://github.com/tryton/sao.git

cd sao

git checkout 6.0
rm ./Gruntfile.js 
# ln -s ../Gruntfile.js
cp ../Gruntfile.js .

# add es locales
rm ./locale/es.po
cd locale
cp ../../locale/es.po .
cd ..

npm install grunt-po2json
#here => npm install @sentry/browser @sentry/tracing
npm install @sentry/browser
npm install @sentry/tracing
npm install --production

#Create backup image folder
mkdir original_images
cp images/* original_images/

#adding kalenis_views folder
mkdir kalenis_views
cd kalenis_views
ln -s ../../importAddons.js
ln -s ../../tree_view
# ln -s ../importAddons.js
cd ..
cd ../utils/ 
./apply_theme.sh kalenis
cd ../sao

grunt


cd ..
# cd utils
# ./
# cd ..
cd tree_view
npm install
npm run build
#HERE => update sentry release
node sentry_release.js


# rm -r kalenis_addons/tree_view/node_modules
# cd kalenis_addons/tree_view && ln -s ../../node_modules
# npm run build


echo "Note that the entry root in the section [web] of trytond.conf must be set to this directory:" 
echo "================================================================="
cd ../sao
pwd
echo "================================================================="
