#!/bin/sh
cd ..

dist_folder="frontend_dist_$1"
echo $dist_folder
if [ -d "./"$dist_folder ]; then
    echo "Removing old dist"
    rm -r ./$dist_folder
    rm $dist_folder.tar.gz
fi


mkdir $dist_folder
echo "Copying files to frontend_dist"
cp -r sao/bower_components $dist_folder
cp -r sao/dist $dist_folder
mkdir $dist_folder/kalenis_views
mkdir $dist_folder/kalenis_views/tree_view
cp importAddons.js $dist_folder/kalenis_views
cp tree_view/build/asset-manifest.json $dist_folder/kalenis_views/tree_view
cp -r tree_view/build $dist_folder/kalenis_views/tree_view

cp -r sao/locale $dist_folder
cp -r sao/original_images $dist_folder
cp -r theme $dist_folder
cp ./utils/dist_apply_theme.sh $dist_folder

cd $dist_folder
./dist_apply_theme.sh kalenis

cd ..
echo "Creating .tar.gz "
tar -cvzf $dist_folder.tar.gz $dist_folder/
echo "------------------"

echo "Finished. Note that the entry root in the section [web] of trytond.conf must be set to the frontend_dist folder."

echo "--------------------"