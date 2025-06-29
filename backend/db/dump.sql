PGDMP                       }            inventory_db    17.4 (Debian 17.4-1.pgdg120+2)    17.4 (Debian 17.4-1.pgdg120+2) }    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16384    inventory_db    DATABASE     w   CREATE DATABASE inventory_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';
    DROP DATABASE inventory_db;
                     postgres    false            �            1259    26759    asset    TABLE     u  CREATE TABLE public.asset (
    asset_id integer NOT NULL,
    asset_type_id integer,
    make_id integer,
    model_id integer,
    name character varying(255),
    serial_number character varying(255),
    it_asset_code character varying(255),
    mac_address character varying(100),
    ipv4_address character varying(100),
    status character varying(100),
    owner_type character varying(100),
    acquisition_type character varying(100),
    current_user_id integer,
    inventory_location character varying(255),
    os_id integer,
    os_version_id integer,
    po_number character varying(100),
    invoice_number character varying(100),
    acquisition_date date,
    extended_warranty_expiry date,
    lease_end_date date,
    vendor_id integer,
    rental_amount numeric(12,2),
    acquisition_price numeric(12,2),
    depreciation_pct numeric(5,2),
    current_price numeric(12,2),
    min_contract_period integer,
    tags character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    extended_warranty_vendor_id integer,
    extended_warranty_vendor integer,
    warranty_expiry date,
    deleted boolean DEFAULT false,
    asset_category character varying(50),
    license_name character varying(255),
    license_validity_period integer,
    license_user_count integer
);
    DROP TABLE public.asset;
       public         heap r       postgres    false            �            1259    26758    asset_asset_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.asset_asset_id_seq;
       public               postgres    false    232            �           0    0    asset_asset_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.asset_asset_id_seq OWNED BY public.asset.asset_id;
          public               postgres    false    231            �            1259    26836    asset_assignment_history    TABLE     �   CREATE TABLE public.asset_assignment_history (
    assignment_id integer NOT NULL,
    asset_id integer,
    user_id integer,
    assigned_date timestamp without time zone,
    unassigned_date timestamp without time zone
);
 ,   DROP TABLE public.asset_assignment_history;
       public         heap r       postgres    false            �            1259    26835 *   asset_assignment_history_assignment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_assignment_history_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 A   DROP SEQUENCE public.asset_assignment_history_assignment_id_seq;
       public               postgres    false    236            �           0    0 *   asset_assignment_history_assignment_id_seq    SEQUENCE OWNED BY     y   ALTER SEQUENCE public.asset_assignment_history_assignment_id_seq OWNED BY public.asset_assignment_history.assignment_id;
          public               postgres    false    235            �            1259    26636 
   asset_make    TABLE     �   CREATE TABLE public.asset_make (
    make_id integer NOT NULL,
    make_name character varying(255) NOT NULL,
    type_id bigint,
    status character varying DEFAULT 'Active'::character varying
);
    DROP TABLE public.asset_make;
       public         heap r       postgres    false            �            1259    26635    asset_make_make_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_make_make_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.asset_make_make_id_seq;
       public               postgres    false    220            �           0    0    asset_make_make_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.asset_make_make_id_seq OWNED BY public.asset_make.make_id;
          public               postgres    false    219            �            1259    26643    asset_model    TABLE     4  CREATE TABLE public.asset_model (
    model_id integer NOT NULL,
    make_id integer,
    model_name character varying(255) NOT NULL,
    ram character varying(100),
    storage character varying(100),
    processor character varying(255),
    status character varying DEFAULT 'Active'::character varying
);
    DROP TABLE public.asset_model;
       public         heap r       postgres    false            �            1259    26642    asset_model_model_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_model_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.asset_model_model_id_seq;
       public               postgres    false    222            �           0    0    asset_model_model_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.asset_model_model_id_seq OWNED BY public.asset_model.model_id;
          public               postgres    false    221            �            1259    65538    asset_po    TABLE     ]  CREATE TABLE public.asset_po (
    po_id integer NOT NULL,
    acquisition_type character varying NOT NULL,
    po_number character varying NOT NULL,
    invoice_number character varying,
    acquisition_date date,
    vendor_id integer,
    owner_type character varying NOT NULL,
    lease_end_date date,
    rental_amount numeric,
    min_contract_period integer,
    acquisition_price numeric,
    depreciation_pct numeric,
    current_price numeric,
    total_devices numeric,
    warranty_expiry_date date,
    CONSTRAINT asset_po_acquisition_type_check CHECK (((acquisition_type)::text = ANY ((ARRAY['Bought'::character varying, 'Leased'::character varying, 'Rented'::character varying])::text[]))),
    CONSTRAINT asset_po_owner_type_check CHECK (((owner_type)::text = ANY ((ARRAY['Celcom'::character varying, 'Vendor'::character varying])::text[])))
);
    DROP TABLE public.asset_po;
       public         heap r       postgres    false            �            1259    65537    asset_po_po_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_po_po_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.asset_po_po_id_seq;
       public               postgres    false    243            �           0    0    asset_po_po_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.asset_po_po_id_seq OWNED BY public.asset_po.po_id;
          public               postgres    false    242            �            1259    26815    asset_status_history    TABLE     �   CREATE TABLE public.asset_status_history (
    history_id integer NOT NULL,
    asset_id integer,
    status character varying(100),
    changed_by integer,
    change_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    remarks text
);
 (   DROP TABLE public.asset_status_history;
       public         heap r       postgres    false            �            1259    26814 #   asset_status_history_history_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_status_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 :   DROP SEQUENCE public.asset_status_history_history_id_seq;
       public               postgres    false    234            �           0    0 #   asset_status_history_history_id_seq    SEQUENCE OWNED BY     k   ALTER SEQUENCE public.asset_status_history_history_id_seq OWNED BY public.asset_status_history.history_id;
          public               postgres    false    233            �            1259    26853 	   asset_tag    TABLE     d   CREATE TABLE public.asset_tag (
    tag_id integer NOT NULL,
    tag_name character varying(100)
);
    DROP TABLE public.asset_tag;
       public         heap r       postgres    false            �            1259    26861    asset_tag_assignment    TABLE     i   CREATE TABLE public.asset_tag_assignment (
    asset_id integer NOT NULL,
    tag_id integer NOT NULL
);
 (   DROP TABLE public.asset_tag_assignment;
       public         heap r       postgres    false            �            1259    26852    asset_tag_tag_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_tag_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.asset_tag_tag_id_seq;
       public               postgres    false    238            �           0    0    asset_tag_tag_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.asset_tag_tag_id_seq OWNED BY public.asset_tag.tag_id;
          public               postgres    false    237            �            1259    26627 
   asset_type    TABLE     �   CREATE TABLE public.asset_type (
    type_id integer NOT NULL,
    asset_type_name character varying(255) NOT NULL,
    description text,
    status character varying DEFAULT 'Active'::character varying,
    category character varying(50)
);
    DROP TABLE public.asset_type;
       public         heap r       postgres    false            �            1259    26626    asset_type_asset_type_id_seq    SEQUENCE     �   CREATE SEQUENCE public.asset_type_asset_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.asset_type_asset_type_id_seq;
       public               postgres    false    218            �           0    0    asset_type_asset_type_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.asset_type_asset_type_id_seq OWNED BY public.asset_type.type_id;
          public               postgres    false    217            �            1259    26877 	   audit_log    TABLE     �   CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    asset_id integer,
    user_id integer,
    action character varying(100),
    action_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    details text
);
    DROP TABLE public.audit_log;
       public         heap r       postgres    false            �            1259    26876    audit_log_log_id_seq    SEQUENCE     �   CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.audit_log_log_id_seq;
       public               postgres    false    241            �           0    0    audit_log_log_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;
          public               postgres    false    240            �            1259    26703    os    TABLE     �   CREATE TABLE public.os (
    os_id integer NOT NULL,
    os_type character varying(100),
    status character varying DEFAULT 'Active'::character varying
);
    DROP TABLE public.os;
       public         heap r       postgres    false            �            1259    26702    os_os_id_seq    SEQUENCE     �   CREATE SEQUENCE public.os_os_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.os_os_id_seq;
       public               postgres    false    224            �           0    0    os_os_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.os_os_id_seq OWNED BY public.os.os_id;
          public               postgres    false    223            �            1259    26746 
   os_version    TABLE     �   CREATE TABLE public.os_version (
    os_version_id integer NOT NULL,
    os_id integer,
    version character varying(100),
    status character varying DEFAULT 'Active'::character varying
);
    DROP TABLE public.os_version;
       public         heap r       postgres    false            �            1259    26745    os_version_os_version_id_seq    SEQUENCE     �   CREATE SEQUENCE public.os_version_os_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.os_version_os_version_id_seq;
       public               postgres    false    230            �           0    0    os_version_os_version_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.os_version_os_version_id_seq OWNED BY public.os_version.os_version_id;
          public               postgres    false    229            �            1259    26726    user    TABLE     �  CREATE TABLE public."user" (
    user_id integer NOT NULL,
    fullname_or_officename character varying(255),
    department character varying(100),
    designation character varying(100),
    email character varying(255),
    is_office_asset boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location character varying(255),
    status character varying DEFAULT 'Active'::character varying,
    employee_code character varying(50) NOT NULL,
    user_type character varying(50) DEFAULT 'Permanent'::character varying NOT NULL,
    country character varying(100),
    city character varying(100)
);
    DROP TABLE public."user";
       public         heap r       postgres    false            �            1259    26725    user_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.user_user_id_seq;
       public               postgres    false    228            �           0    0    user_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.user_user_id_seq OWNED BY public."user".user_id;
          public               postgres    false    227            �            1259    26717    vendor    TABLE     �   CREATE TABLE public.vendor (
    vendor_id integer NOT NULL,
    vendor_name character varying(255) NOT NULL,
    contact_info character varying(255),
    status character varying DEFAULT 'Active'::character varying
);
    DROP TABLE public.vendor;
       public         heap r       postgres    false            �            1259    26716    vendor_vendor_id_seq    SEQUENCE     �   CREATE SEQUENCE public.vendor_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.vendor_vendor_id_seq;
       public               postgres    false    226            �           0    0    vendor_vendor_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.vendor_vendor_id_seq OWNED BY public.vendor.vendor_id;
          public               postgres    false    225            �           2604    26762    asset asset_id    DEFAULT     p   ALTER TABLE ONLY public.asset ALTER COLUMN asset_id SET DEFAULT nextval('public.asset_asset_id_seq'::regclass);
 =   ALTER TABLE public.asset ALTER COLUMN asset_id DROP DEFAULT;
       public               postgres    false    231    232    232            �           2604    26839 &   asset_assignment_history assignment_id    DEFAULT     �   ALTER TABLE ONLY public.asset_assignment_history ALTER COLUMN assignment_id SET DEFAULT nextval('public.asset_assignment_history_assignment_id_seq'::regclass);
 U   ALTER TABLE public.asset_assignment_history ALTER COLUMN assignment_id DROP DEFAULT;
       public               postgres    false    235    236    236            �           2604    26639    asset_make make_id    DEFAULT     x   ALTER TABLE ONLY public.asset_make ALTER COLUMN make_id SET DEFAULT nextval('public.asset_make_make_id_seq'::regclass);
 A   ALTER TABLE public.asset_make ALTER COLUMN make_id DROP DEFAULT;
       public               postgres    false    219    220    220            �           2604    26646    asset_model model_id    DEFAULT     |   ALTER TABLE ONLY public.asset_model ALTER COLUMN model_id SET DEFAULT nextval('public.asset_model_model_id_seq'::regclass);
 C   ALTER TABLE public.asset_model ALTER COLUMN model_id DROP DEFAULT;
       public               postgres    false    222    221    222            �           2604    65541    asset_po po_id    DEFAULT     p   ALTER TABLE ONLY public.asset_po ALTER COLUMN po_id SET DEFAULT nextval('public.asset_po_po_id_seq'::regclass);
 =   ALTER TABLE public.asset_po ALTER COLUMN po_id DROP DEFAULT;
       public               postgres    false    242    243    243            �           2604    26818    asset_status_history history_id    DEFAULT     �   ALTER TABLE ONLY public.asset_status_history ALTER COLUMN history_id SET DEFAULT nextval('public.asset_status_history_history_id_seq'::regclass);
 N   ALTER TABLE public.asset_status_history ALTER COLUMN history_id DROP DEFAULT;
       public               postgres    false    233    234    234            �           2604    26856    asset_tag tag_id    DEFAULT     t   ALTER TABLE ONLY public.asset_tag ALTER COLUMN tag_id SET DEFAULT nextval('public.asset_tag_tag_id_seq'::regclass);
 ?   ALTER TABLE public.asset_tag ALTER COLUMN tag_id DROP DEFAULT;
       public               postgres    false    237    238    238            �           2604    26630    asset_type type_id    DEFAULT     ~   ALTER TABLE ONLY public.asset_type ALTER COLUMN type_id SET DEFAULT nextval('public.asset_type_asset_type_id_seq'::regclass);
 A   ALTER TABLE public.asset_type ALTER COLUMN type_id DROP DEFAULT;
       public               postgres    false    218    217    218            �           2604    26880    audit_log log_id    DEFAULT     t   ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);
 ?   ALTER TABLE public.audit_log ALTER COLUMN log_id DROP DEFAULT;
       public               postgres    false    240    241    241            �           2604    26706    os os_id    DEFAULT     d   ALTER TABLE ONLY public.os ALTER COLUMN os_id SET DEFAULT nextval('public.os_os_id_seq'::regclass);
 7   ALTER TABLE public.os ALTER COLUMN os_id DROP DEFAULT;
       public               postgres    false    223    224    224            �           2604    26749    os_version os_version_id    DEFAULT     �   ALTER TABLE ONLY public.os_version ALTER COLUMN os_version_id SET DEFAULT nextval('public.os_version_os_version_id_seq'::regclass);
 G   ALTER TABLE public.os_version ALTER COLUMN os_version_id DROP DEFAULT;
       public               postgres    false    230    229    230            �           2604    26729    user user_id    DEFAULT     n   ALTER TABLE ONLY public."user" ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);
 =   ALTER TABLE public."user" ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    227    228    228            �           2604    26720    vendor vendor_id    DEFAULT     t   ALTER TABLE ONLY public.vendor ALTER COLUMN vendor_id SET DEFAULT nextval('public.vendor_vendor_id_seq'::regclass);
 ?   ALTER TABLE public.vendor ALTER COLUMN vendor_id DROP DEFAULT;
       public               postgres    false    226    225    226            �          0    26759    asset 
   TABLE DATA           _  COPY public.asset (asset_id, asset_type_id, make_id, model_id, name, serial_number, it_asset_code, mac_address, ipv4_address, status, owner_type, acquisition_type, current_user_id, inventory_location, os_id, os_version_id, po_number, invoice_number, acquisition_date, extended_warranty_expiry, lease_end_date, vendor_id, rental_amount, acquisition_price, depreciation_pct, current_price, min_contract_period, tags, created_at, updated_at, extended_warranty_vendor_id, extended_warranty_vendor, warranty_expiry, deleted, asset_category, license_name, license_validity_period, license_user_count) FROM stdin;
    public               postgres    false    232   �       �          0    26836    asset_assignment_history 
   TABLE DATA           t   COPY public.asset_assignment_history (assignment_id, asset_id, user_id, assigned_date, unassigned_date) FROM stdin;
    public               postgres    false    236   ��       �          0    26636 
   asset_make 
   TABLE DATA           I   COPY public.asset_make (make_id, make_name, type_id, status) FROM stdin;
    public               postgres    false    220   !�       �          0    26643    asset_model 
   TABLE DATA           e   COPY public.asset_model (model_id, make_id, model_name, ram, storage, processor, status) FROM stdin;
    public               postgres    false    222   ��       �          0    65538    asset_po 
   TABLE DATA             COPY public.asset_po (po_id, acquisition_type, po_number, invoice_number, acquisition_date, vendor_id, owner_type, lease_end_date, rental_amount, min_contract_period, acquisition_price, depreciation_pct, current_price, total_devices, warranty_expiry_date) FROM stdin;
    public               postgres    false    243   1�       �          0    26815    asset_status_history 
   TABLE DATA           n   COPY public.asset_status_history (history_id, asset_id, status, changed_by, change_date, remarks) FROM stdin;
    public               postgres    false    234   r�       �          0    26853 	   asset_tag 
   TABLE DATA           5   COPY public.asset_tag (tag_id, tag_name) FROM stdin;
    public               postgres    false    238   J�       �          0    26861    asset_tag_assignment 
   TABLE DATA           @   COPY public.asset_tag_assignment (asset_id, tag_id) FROM stdin;
    public               postgres    false    239   ��       �          0    26627 
   asset_type 
   TABLE DATA           ]   COPY public.asset_type (type_id, asset_type_name, description, status, category) FROM stdin;
    public               postgres    false    218   ��       �          0    26877 	   audit_log 
   TABLE DATA           \   COPY public.audit_log (log_id, asset_id, user_id, action, action_date, details) FROM stdin;
    public               postgres    false    241   �       �          0    26703    os 
   TABLE DATA           4   COPY public.os (os_id, os_type, status) FROM stdin;
    public               postgres    false    224   Լ       �          0    26746 
   os_version 
   TABLE DATA           K   COPY public.os_version (os_version_id, os_id, version, status) FROM stdin;
    public               postgres    false    230   $�       �          0    26726    user 
   TABLE DATA           �   COPY public."user" (user_id, fullname_or_officename, department, designation, email, is_office_asset, created_at, location, status, employee_code, user_type, country, city) FROM stdin;
    public               postgres    false    228   ��       �          0    26717    vendor 
   TABLE DATA           N   COPY public.vendor (vendor_id, vendor_name, contact_info, status) FROM stdin;
    public               postgres    false    226   K�       �           0    0    asset_asset_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.asset_asset_id_seq', 25, true);
          public               postgres    false    231            �           0    0 *   asset_assignment_history_assignment_id_seq    SEQUENCE SET     X   SELECT pg_catalog.setval('public.asset_assignment_history_assignment_id_seq', 4, true);
          public               postgres    false    235            �           0    0    asset_make_make_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.asset_make_make_id_seq', 12, true);
          public               postgres    false    219            �           0    0    asset_model_model_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.asset_model_model_id_seq', 10, true);
          public               postgres    false    221            �           0    0    asset_po_po_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.asset_po_po_id_seq', 54, true);
          public               postgres    false    242            �           0    0 #   asset_status_history_history_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.asset_status_history_history_id_seq', 51, true);
          public               postgres    false    233            �           0    0    asset_tag_tag_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.asset_tag_tag_id_seq', 2, true);
          public               postgres    false    237            �           0    0    asset_type_asset_type_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.asset_type_asset_type_id_seq', 14, true);
          public               postgres    false    217            �           0    0    audit_log_log_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.audit_log_log_id_seq', 97, true);
          public               postgres    false    240            �           0    0    os_os_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.os_os_id_seq', 5, true);
          public               postgres    false    223            �           0    0    os_version_os_version_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.os_version_os_version_id_seq', 9, true);
          public               postgres    false    229            �           0    0    user_user_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.user_user_id_seq', 8, true);
          public               postgres    false    227            �           0    0    vendor_vendor_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.vendor_vendor_id_seq', 7, true);
          public               postgres    false    225                       2606    26841 6   asset_assignment_history asset_assignment_history_pkey 
   CONSTRAINT        ALTER TABLE ONLY public.asset_assignment_history
    ADD CONSTRAINT asset_assignment_history_pkey PRIMARY KEY (assignment_id);
 `   ALTER TABLE ONLY public.asset_assignment_history DROP CONSTRAINT asset_assignment_history_pkey;
       public                 postgres    false    236            �           2606    26773    asset asset_it_asset_code_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_it_asset_code_key UNIQUE (it_asset_code);
 G   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_it_asset_code_key;
       public                 postgres    false    232            �           2606    26641    asset_make asset_make_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.asset_make
    ADD CONSTRAINT asset_make_pkey PRIMARY KEY (make_id);
 D   ALTER TABLE ONLY public.asset_make DROP CONSTRAINT asset_make_pkey;
       public                 postgres    false    220            �           2606    26650    asset_model asset_model_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.asset_model
    ADD CONSTRAINT asset_model_pkey PRIMARY KEY (model_id);
 F   ALTER TABLE ONLY public.asset_model DROP CONSTRAINT asset_model_pkey;
       public                 postgres    false    222            �           2606    26769    asset asset_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_pkey PRIMARY KEY (asset_id);
 :   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_pkey;
       public                 postgres    false    232                       2606    65547    asset_po asset_po_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.asset_po
    ADD CONSTRAINT asset_po_pkey PRIMARY KEY (po_id);
 @   ALTER TABLE ONLY public.asset_po DROP CONSTRAINT asset_po_pkey;
       public                 postgres    false    243                       2606    65554 "   asset_po asset_po_po_number_unique 
   CONSTRAINT     b   ALTER TABLE ONLY public.asset_po
    ADD CONSTRAINT asset_po_po_number_unique UNIQUE (po_number);
 L   ALTER TABLE ONLY public.asset_po DROP CONSTRAINT asset_po_po_number_unique;
       public                 postgres    false    243            �           2606    26771    asset asset_serial_number_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_serial_number_key UNIQUE (serial_number);
 G   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_serial_number_key;
       public                 postgres    false    232            �           2606    26823 .   asset_status_history asset_status_history_pkey 
   CONSTRAINT     t   ALTER TABLE ONLY public.asset_status_history
    ADD CONSTRAINT asset_status_history_pkey PRIMARY KEY (history_id);
 X   ALTER TABLE ONLY public.asset_status_history DROP CONSTRAINT asset_status_history_pkey;
       public                 postgres    false    234                       2606    26865 .   asset_tag_assignment asset_tag_assignment_pkey 
   CONSTRAINT     z   ALTER TABLE ONLY public.asset_tag_assignment
    ADD CONSTRAINT asset_tag_assignment_pkey PRIMARY KEY (asset_id, tag_id);
 X   ALTER TABLE ONLY public.asset_tag_assignment DROP CONSTRAINT asset_tag_assignment_pkey;
       public                 postgres    false    239    239                       2606    26858    asset_tag asset_tag_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.asset_tag
    ADD CONSTRAINT asset_tag_pkey PRIMARY KEY (tag_id);
 B   ALTER TABLE ONLY public.asset_tag DROP CONSTRAINT asset_tag_pkey;
       public                 postgres    false    238                       2606    26860     asset_tag asset_tag_tag_name_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.asset_tag
    ADD CONSTRAINT asset_tag_tag_name_key UNIQUE (tag_name);
 J   ALTER TABLE ONLY public.asset_tag DROP CONSTRAINT asset_tag_tag_name_key;
       public                 postgres    false    238            �           2606    26634    asset_type asset_type_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.asset_type
    ADD CONSTRAINT asset_type_pkey PRIMARY KEY (type_id);
 D   ALTER TABLE ONLY public.asset_type DROP CONSTRAINT asset_type_pkey;
       public                 postgres    false    218            	           2606    26885    audit_log audit_log_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);
 B   ALTER TABLE ONLY public.audit_log DROP CONSTRAINT audit_log_pkey;
       public                 postgres    false    241            �           2606    26708 
   os os_pkey 
   CONSTRAINT     K   ALTER TABLE ONLY public.os
    ADD CONSTRAINT os_pkey PRIMARY KEY (os_id);
 4   ALTER TABLE ONLY public.os DROP CONSTRAINT os_pkey;
       public                 postgres    false    224            �           2606    26751    os_version os_version_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.os_version
    ADD CONSTRAINT os_version_pkey PRIMARY KEY (os_version_id);
 D   ALTER TABLE ONLY public.os_version DROP CONSTRAINT os_version_pkey;
       public                 postgres    false    230            �           2606    26739    user user_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public."user" DROP CONSTRAINT user_email_key;
       public                 postgres    false    228            �           2606    26735    user user_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public."user" DROP CONSTRAINT user_pkey;
       public                 postgres    false    228            �           2606    26724    vendor vendor_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.vendor
    ADD CONSTRAINT vendor_pkey PRIMARY KEY (vendor_id);
 <   ALTER TABLE ONLY public.vendor DROP CONSTRAINT vendor_pkey;
       public                 postgres    false    226                       2606    26774    asset asset_asset_type_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.asset_type(type_id);
 H   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_asset_type_id_fkey;
       public               postgres    false    232    3305    218                       2606    26842 ?   asset_assignment_history asset_assignment_history_asset_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_assignment_history
    ADD CONSTRAINT asset_assignment_history_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
 i   ALTER TABLE ONLY public.asset_assignment_history DROP CONSTRAINT asset_assignment_history_asset_id_fkey;
       public               postgres    false    236    232    3323                       2606    26847 >   asset_assignment_history asset_assignment_history_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_assignment_history
    ADD CONSTRAINT asset_assignment_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);
 h   ALTER TABLE ONLY public.asset_assignment_history DROP CONSTRAINT asset_assignment_history_user_id_fkey;
       public               postgres    false    228    3317    236                       2606    26789     asset asset_current_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_current_user_id_fkey FOREIGN KEY (current_user_id) REFERENCES public."user"(user_id);
 J   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_current_user_id_fkey;
       public               postgres    false    228    3317    232                       2606    26779    asset asset_make_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.asset_make(make_id);
 B   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_make_id_fkey;
       public               postgres    false    220    3307    232                       2606    26784    asset asset_model_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.asset_model(model_id);
 C   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_model_id_fkey;
       public               postgres    false    232    222    3309                       2606    26651 $   asset_model asset_model_make_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_model
    ADD CONSTRAINT asset_model_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.asset_make(make_id) ON DELETE CASCADE;
 N   ALTER TABLE ONLY public.asset_model DROP CONSTRAINT asset_model_make_id_fkey;
       public               postgres    false    220    3307    222                       2606    26799    asset asset_os_id_fkey    FK CONSTRAINT     s   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.os(os_id);
 @   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_os_id_fkey;
       public               postgres    false    224    232    3311                       2606    26804    asset asset_os_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_os_version_id_fkey FOREIGN KEY (os_version_id) REFERENCES public.os_version(os_version_id);
 H   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_os_version_id_fkey;
       public               postgres    false    230    232    3319                       2606    65555    asset asset_po_number_fk    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_po_number_fk FOREIGN KEY (po_number) REFERENCES public.asset_po(po_number);
 B   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_po_number_fk;
       public               postgres    false    243    3341    232            #           2606    65548     asset_po asset_po_vendor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_po
    ADD CONSTRAINT asset_po_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor(vendor_id);
 J   ALTER TABLE ONLY public.asset_po DROP CONSTRAINT asset_po_vendor_id_fkey;
       public               postgres    false    226    243    3313                       2606    26824 7   asset_status_history asset_status_history_asset_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_status_history
    ADD CONSTRAINT asset_status_history_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
 a   ALTER TABLE ONLY public.asset_status_history DROP CONSTRAINT asset_status_history_asset_id_fkey;
       public               postgres    false    234    3323    232                       2606    26829 9   asset_status_history asset_status_history_changed_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_status_history
    ADD CONSTRAINT asset_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public."user"(user_id);
 c   ALTER TABLE ONLY public.asset_status_history DROP CONSTRAINT asset_status_history_changed_by_fkey;
       public               postgres    false    3317    228    234                       2606    26866 7   asset_tag_assignment asset_tag_assignment_asset_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_tag_assignment
    ADD CONSTRAINT asset_tag_assignment_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
 a   ALTER TABLE ONLY public.asset_tag_assignment DROP CONSTRAINT asset_tag_assignment_asset_id_fkey;
       public               postgres    false    232    239    3323                        2606    26871 5   asset_tag_assignment asset_tag_assignment_tag_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_tag_assignment
    ADD CONSTRAINT asset_tag_assignment_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.asset_tag(tag_id) ON DELETE CASCADE;
 _   ALTER TABLE ONLY public.asset_tag_assignment DROP CONSTRAINT asset_tag_assignment_tag_id_fkey;
       public               postgres    false    3331    239    238                       2606    26809    asset asset_vendor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor(vendor_id);
 D   ALTER TABLE ONLY public.asset DROP CONSTRAINT asset_vendor_id_fkey;
       public               postgres    false    226    3313    232            !           2606    26886 !   audit_log audit_log_asset_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON DELETE CASCADE;
 K   ALTER TABLE ONLY public.audit_log DROP CONSTRAINT audit_log_asset_id_fkey;
       public               postgres    false    3323    241    232            "           2606    26891     audit_log audit_log_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);
 J   ALTER TABLE ONLY public.audit_log DROP CONSTRAINT audit_log_user_id_fkey;
       public               postgres    false    228    241    3317                       2606    49175    asset_make fk_asset_make_type    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset_make
    ADD CONSTRAINT fk_asset_make_type FOREIGN KEY (type_id) REFERENCES public.asset_type(type_id);
 G   ALTER TABLE ONLY public.asset_make DROP CONSTRAINT fk_asset_make_type;
       public               postgres    false    218    3305    220                       2606    32777 !   asset fk_extended_warranty_vendor    FK CONSTRAINT     �   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT fk_extended_warranty_vendor FOREIGN KEY (extended_warranty_vendor) REFERENCES public.vendor(vendor_id);
 K   ALTER TABLE ONLY public.asset DROP CONSTRAINT fk_extended_warranty_vendor;
       public               postgres    false    232    3313    226                       2606    32782    asset fk_vendor    FK CONSTRAINT     x   ALTER TABLE ONLY public.asset
    ADD CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendor(vendor_id);
 9   ALTER TABLE ONLY public.asset DROP CONSTRAINT fk_vendor;
       public               postgres    false    232    3313    226                       2606    26752     os_version os_version_os_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.os_version
    ADD CONSTRAINT os_version_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.os(os_id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.os_version DROP CONSTRAINT os_version_os_id_fkey;
       public               postgres    false    230    224    3311            �   �  x��X�r�8=���9Y�$q�B�=%KI��CEt�$�fX&4]���� 	nZ���)�*Ȱ��˗/y��b�\g��m���y�����.�����by�a̼ۭ��PŸR���j2�HD}"C���ǻ2���i<�.����la��β$E3��5tq�~+��l��y^��o�QL�S��.���x�@��wM��>��o�G����2�Bߓݳ��WhW�e�K��(�hh�(�L	��D+�}�	���u1�F����������y�Cs�z�E ��������r�� ��6���faX��@1��\� T���	L�,P$�!N�i3E1"\ax�ԏp� �1\��$L���
��|�"	+m���ǫQ5�X�(,������E��t{{{���!�Kko��?>���Ш""�2�u��pg���yf�n�pݤ�O�"����~�#,�ma�S)9�4���K>x7I�����L ����Lh�Z����1:t�7�7_Gհ�g�3Qө��B�h�Ʒ�#��7)�l����N@�3 ڔI���Nc $�ᥩ��։1~}=h��%��ݍ��jT����t�@����xq� ����͓����%��0����a6����9�F�� �u�[����0��;���Q���ţb_!ꄪJ{Q�O���`�HEŉ�0n�@-�����E1E�@M��ձח� �QnБ�8D;�ĳ#�:� )4Z��KG=�S�]
�r�I����~����3�Z&.M�Y ˝b�H�I�?�qZ�;�W�y<���]��~��c�h�ص�c%&��̨�c�;@�э�~�K��:y�5E�"�$����P��P�C�ܯ����KL�\%iqU��:��P�Ha�!<j�BS�03t�2I�l�7k���<)��}�Q��UY�@��0� 9F�9�U���cu}����4n�S�hGc.��
����Z�^�j6$�<y5��T�,�%}�_u��7B8P�)bE8��䦒���m��n�xRR��N�^C�̳:1e[����I*]fJS�*A�f �%/��$���b�j��d�<�g
y5�1q��b�8[B����Q��U�H���;�M(p
�P���x1[�[N��5�Q������1mJ��%D�,.;ǜE"�&�)��n�
�K��<C[4>0h=0@uH����&8�Co������	����4�@���4;"�4�!�����8U��7����p��S+:Ql��L�x P5LCu��T�el��Y�_��w�j$F=uǒ@��;��B�켨��.�Cwi���Xq*llbh�
,��Tx���:1=)�@�HskJ>�(��}������4�!�`���CZj��+L�V�#J�y��bG��;�
�>�Y���m�E��v��B8�x�z�c"�jTfU�?"�F�W�ʃ����ل���,�Ѻq�-�JY�;���x(.��܍/8؞a^0b��$��l�j���5 ���9��4CƂT2�"���hs�yh
�Z�`k����k�qk!�$D?,E��g�)�*E`�ry��m���x/��Ш)D�[��Q5�����+.?Dk`"���8�Jʤ>���?��)آ�.���4�f�JR5uB<6�C�O��RI2��U!Z��_�ez>���_�[�윍��\8˃a����Lϕ"����z�t�� Q��~$��lK���0 �p$��{�B�C��i�{B�����D����# ZG�;G;0W�b��p�"Z'���"Z�Y{Ǔ�KH@N{�z�C<�<���Z��ͤjƀYA(E�Y�S�:�軛�ɲ�9�"���v��.���e#�(�Q=�&�M�b�-h>�֖��DeҚC��H	�xh�z�v*2"ō�B�2bVi��*�z��;��΃���+T�	��X�?�r~��'
�Cҋ��Ά
��(0p����|�|��?h:j	      �   d   x�uͱ�0Dњ�"���:�����������@�ׁz�M4�cΒ뭸M>��Y6g��?yV����;8w<؞��W`n�8|hN��F������      �   X   x�3�tI���4�tL.�,K�2��@��9sR����9�a"&��9�SΌN3ό3,7��3MĂ3/��54�� nD� �)�      �   �   x�M�A�0D��S��Kp)���lȏ�ߔ�z{I�H2���{��4{���K���K4;�ဇ�Z�읇��*��@�r�!q��rA��丬�F�!�O.��׬�A��&J��A��~����=�+D7���Tq,�7�^4;!���:(      �   1  x�}�AO�0����d;q�^��e �v��	�]���I�6��*R^���Ӌ�pw�~���ӣc��	�/�
r$�p?�^Np���g��_Aӄ�j��\Ј\
�f7�T؀M����_i~UDG�7���%x���������5���j�м�UP��w�����|,��k�)!��9$Y<��>dZ���X�z؀<Z�eQ0����yz\�d��g%
LR�̌�8=��vF�W�ZKV5��RTrIR�`ܚ�~^L�絚f;{��vVں���&�&����j^�	���"b�v�0� K/��      �   �  x�}��n�0���S�B�.��7����v�S�Bu�FH+���/);i˹
3��.G(X�S��(�^��BP��A#����J��M�v�s�gj
	H#E�(�nj�����q|i����'�dH,�Y#9;��������!x�c;��f|���<L��=�~:��d�&���ׁ&,ND���%�ɹh�i��i�r� &�D��a�r�vj�)Ʃ�^F�w�04����d(����M�=�XNhu6"~�H�b\����	P�h�H&�>�0iG����1��ͷ�Õ���HKA�����]�u��-�m��E
v�[� ��j_}9��6�%M;.�����枲�OyAJ9Cn�3�ͬ-Ϟ#��n�7�վ%_���@��q���f�l��6��]������a�Ɖ���Ǻ��<��C�G��RS��0��	�1q�ri^�/8��_�I'쌑�ZJ��H�      �   &   x�3�tI-K��/�M�+�2�,I-.Q(IL����� ��      �      x�3�4�2�4����� (�      �   [   x�3�N-*K-���tL.�,K��H,J)O,J�2�tI-�.�/�&i��X�CΌ��(3�hj^j�Bbqqj	�CΠ���c��b���� *�/f      �   �  x����n�Jǯ���t4���#w��쩶�V@�t��ۦ[K*�����R�$�J�A�����mD:�h<L�ӫ�w_�J�i.@&`RP�t�'��x;۾o�����g�����_��*o�E�͓��v�;�(�5[/6i�z_.c선K%
І�!����Q�6��k��j��W�e2�l޳XE}���F���D�j'���6�l�<��ٖA���d5����S��^g��6�ue-�MQ�
�t���z��X��ԍҌ���B��|��\�lUm_�乊����(��n0Q��P�׍�����$H@��GDV�Lj�#$-�I�RI��F��)���������a��Y��/�٢������,��\$�[��m���^v���e�|�=]��"yX�\������YRpnp&�a�U� L S�\ꂼqG���t���,��t�6[��d�:_-���v�p/�(������p����Ӈ�O\J9�
��Rr�+����g��}�������/ؒ��bmz�P�h:C��g�~,����?��je�S,�(H+��0�`�V#�0�F�Y#�/2ҕl (:�"�`�h���0�7{�	N�>�@>`�Od;�RҜ���G���D)�*�m61����û����r*&ړ���t0�|��6��4��tvw`�Y����jG[�r��c��a���k�T(m��,&�G���ǂ���y�q{R��Xa�:�1��	�Ǣð���cdG�	Smx\4��UZ3�U�T��h3�<i��n�ͤ�@���`D?J,@�_}W4n!\,'׷�5Lc�*�|{\��2D<��*��wv�̞�'C�ѐ9=C��	g�LX8k��������C1V�OÂE�!v�Z��ǂ��u���g|��;�ZV�3��������ʈ�:��^KN���;�-�ж��t��$׶�z,6����?Ø�R��f��O	�Y�t`}.m�{��t4|܌b����0�#X�<V�6�;3��i����y�j�K�v��R���*z���j�{��5æ���tX�L��������V7�C^�s�2���#�k=׊�Ũ��&�͜O�\���Ǘ��������X��9eN�u|��dʷl89$`�:�U!��x��l��l��]����l�� L�l��呣x��}�����'k4`��ĩ�����T�G�V�o-��Z+�o�E����-VwE�T�(�Z���<�]@̑�N�S,��X�쩔�2���Ď�$uC��
�9�}����8���e����E���aOU�g�QQp:qE8�����y�N��c/��2�B���T���XcE�@��
�
*��b�mb��G$<�U1:�o싧䖄��Q���<�#��4�2�2k��7{��-�E��{ͪ�&`�ĳ�q�Tӛ�R�E�p�Ҧ8yrD����65�޿���rG��"�x��T/Ć��7�w���k	      �   @   x�3���K�//�tL.�,K�2����+��qM8s���a\SNǼ����CNϼD�`� P      �   �   x�3�4�44�tL.�,K�2�4��ML�V(K�+)-J�I����x�@^xf^J~y�BD �g^"D���71Y�?B!8��,�H�P� ���Ӑ�%5)31O�!
4�34�h!B�(�����X�5F��� |1�      �   �  x�}��N�0Eו���U~ĉ���a��x�f��J:жGN�ߏ^����R�U��ܲ%<�`�-@������i>�G^�:䂰�0n��ZT%��V��?9�ŚK�Øl3��˟�4[���n-l6������5a�H4R���5����[�\\��%�8����:Ce���SYi��9�:��(9\��mpa�'�\;�\h��ѓcX����Y�>`����Gh��o^f��3hI�4Bɩ��B��]ۇ{�ȯ]���EfW]�7n5n�lBSp�ַ�yF��������1,�!	C#j�4-�⪂��D,�bPTp�K8���雸��bѯ��pIQ�Vr��Şp'��	�ҍ�1=��w����,j��|O��E����/      �   �   x�5ͱ�0����)�$B�dј��h��R�Ko�O�i�z�|9�������,��o�K�z�3�d�n=�AإY�/��Q��#pY�!�G��u�.k�h�������h۳F�&����Ue��*�'vA_���m��u7:�     