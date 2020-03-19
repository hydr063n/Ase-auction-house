create database auctionbot;
use auctionbot;
create table users (
    id varchar(255) not null PRIMARY KEY, 
    balance bigint not null,
    rep bigint not null
);

create table admins (
    id varchar(255) not null PRIMARY KEY,
    status enum('DECLINE','ACCEPT','PENDING') not null default 'PENDING'
);

create table settings (
    id int(11) not null PRIMARY KEY auto_increment,
    transfer_tax int(11) not null default 0,
    balance bigint not null default 0
);

create table bids (
    id int(11) not null PRIMARY KEY auto_increment,
    auction_id int(11) not null default 0,
    user_id varchar(255) not null default 0,
    amount int(11) not null default 0
);

create table auctions (
    id int(11) not null PRIMARY KEY auto_increment,
    status enum('DECLINE','ACCEPT','PENDING', 'SETUP') not null default 'SETUP',
    start_date datetime null, 
    end_date datetime null,
    created_at datetime not null default CURRENT_TIMESTAMP,
    tax int(11) null,
    expire_time datetime null,
    title varchar(255) null, 
    description text null, 
    start_bid int(11) null,
    delivery text null,
    prize text null,
    rep int(11) not null default 0,
    user_id varchar(255) not null default 0,
    image varchar(4096) not null default 'https://www.verdict.co.uk/wp-content/uploads/2018/01/shutterstock_613264382-1440x1018.jpg'
);