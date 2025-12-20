root@ubuntu-4gb-nbg1-1:~/REAL-AIDevelo.ai# cd ~/REAL-AIDevelo.ai
git pull
cat infra/nginx/nginx.conf > /etc/nginx/nginx.conf
nginx -t
systemctl restart nginx

# Cloudflare Tunnel Config aktualisieren
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: c7580385-88ce-474b-b8bd-9bea4d52b296
credentials-file: /root/.cloudflared/c7580385-88ce-474b-b8bd-9bea4d52b296.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

systemctl restart cloudflared
remote: Enumerating objects: 11, done.
remote: Counting objects: 100% (11/11), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 6 (delta 3), reused 6 (delta 3), pack-reused 0 (from 0)
Unpacking objects: 100% (6/6), 798 bytes | 159.00 KiB/s, done.
From https://github.com/keokukzh/REAL-AIDevelo.ai
   fbe9ca3..b16cc7d  main       -> origin/main
Updating fbe9ca3..b16cc7d
error: Your local changes to the following files would be overwritten by merge:
        setup_nginx_proxy.sh
Please commit your changes or stash them before you merge.
Aborting
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
Job for nginx.service failed because the control process exited with error code.
See "systemctl status nginx.service" and "journalctl -xeu nginx.service" for details.
root@ubuntu-4gb-nbg1-1:~/REAL-AIDevelo.ai#