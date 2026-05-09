/* Demo ma’lumot — faqat rivojlantirish uchun. Avval schema.sql ishga tushiring. */

begin;

-- Maktablar
insert into public.schools (id, name, director, phone, address) values
  ('11111111-1111-1111-1111-111111111101', 'Yangi Namangan 1-maktab', 'Karimova Dilnoza Faxriddinovna', '+998 69 226 41 02', 'Yangi Namangan tumani, Do‘stlik MFY'),
  ('11111111-1111-1111-1111-111111111102', 'Yangi Namangan 12-son UM', 'Yo‘ldoshev Bekzod Akmalovich', '+998 69 227 91 77', 'Yangi Namangan tumani, Paxtakor MFY'),
  ('11111111-1111-1111-1111-111111111103', 'Yangi Namangan Ixtisoslashtirilgan maktab', 'Rahimova Nodira Shuhratovna', '+998 69 229 03 41', 'Yangi Namangan tumani, Yoshlar ko‘chasi');

-- Sinflar
insert into public.classes (id, school_id, name) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', '1-A'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', '1-B'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', '2-A'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', '9-A'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', '11-B');

-- Trigger student_count uchun avtomatik hisoblangan — insertdan keyin to‘ldirib chiqamiz.

-- Demo o‘quvchilar (JSHSHIR 14 ta raqam)
insert into public.students (
  id, class_id, full_name, jshshir, passport, birth_date, phone, parent_phone, address, gender, image, status
) values
  ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','Rustamova Malika Shuhratovna','12345678901234','FA1234567','2017-03-21','+998 93 510 44 91','+998 91 710 09 82','Namangan viloyati, Yangi Namangan','female','','active'),
  ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222201','Yo‘ldoshev Bekzodbek Ahmadjon o‘g‘li','12345678901235','FB2234568','2016-09-09','+998 94 201 81 72','+998 90 512 91 41','Namangan viloyati, Yangi Namangan','male','','active'),
  ('33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222202','Karimova Lola Mirzamomovna','12345678901236','FA3234569','2017-07-02','','+998 97 771 82 91','Namangan viloyati, Paxtakor MFY','female','','active'),
  ('33333333-3333-3333-3333-333333333304','22222222-2222-2222-2222-222222222203','Mahmudova Nigora Ilhomovna','12345678901237','FB4234570','2015-12-01','+998 99 881 73 91','+998 91 661 71 71','Namangan viloyati, Do‘stlik MFY','female','','active'),
  ('33333333-3333-3333-3333-333333333305','22222222-2222-2222-2222-222222222203','Temirov Otabek Salimovich','12345678901238','FC5234571','2015-01-29','','+998 93 771 71 71','Namangan viloyati, Yangi Namangan','male','','inactive');

-- Qo‘shimcha sintetik yozuvlar (jadval uchun hajm)
insert into public.students (class_id, full_name, jshshir, passport, birth_date, phone, parent_phone, address, gender, status)
select
  '22222222-2222-2222-2222-222222222201',
  'Demo O‘quvchi ' || gs::text,
  lpad((34000000000000 + gs)::text, 14, '0'),
  'FD' || lpad(gs::text, 6, '0'),
  (date '2016-06-01' + (gs % 420))::date,
  case when gs % 2 = 0 then '+998 90 ' || lpad((100000 + gs)::text, 6, '0') else null end,
  '+998 91 ' || lpad((200000 + gs)::text, 6, '0'),
  'Namangan tumani demo manzil #' || gs::text,
  case when gs % 2 = 0 then 'male' else 'female' end,
  'active'
from generate_series(1, 42) gs;

commit;
