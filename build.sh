rm editor.tar
sudo docker build -t editor .
sudo docker save editor -o editor.tar
sudo chown max editor.tar

nc 10.100.55.190 9999 < editor.tar