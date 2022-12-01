create database login_node_curso;
use login_node_curso;

create table users(
id int primary key not null auto_increment,
user varchar(50),
email varchar(50),
pass varchar(255));

select * from users;
drop table users;