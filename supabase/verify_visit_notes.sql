-- 1) 컬럼 구성 확인
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'visit_notes'
order by ordinal_position;

-- 2) RLS 활성화 여부 확인 (rowsecurity = true 여야 함)
select relname as table, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.visit_notes'::regclass;

-- 3) 정책 목록 확인 (select/insert/update 3개)
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'visit_notes'
order by policyname;

-- 4) UNIQUE 제약 확인
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.visit_notes'::regclass and contype = 'u';
