-- Optional example data. Safe to delete or skip.
-- Running it again does not duplicate categories or identical words.

insert into public.categories (name)
values ('Vestiti'), ('Viaggiare'), ('Famiglia'), ('Cibo')
on conflict (name) do nothing;

insert into public.words (hungarian, italian, category_id)
select v.hungarian, v.italian, c.id
from (
  values
    ('Vestiti', 'kabát', 'la giacca'),
    ('Vestiti', 'nadrág', 'i pantaloni'),
    ('Vestiti', 'ing', 'la camicia'),
    ('Vestiti', 'cipő', 'le scarpe'),
    ('Viaggiare', 'vonat', 'il treno'),
    ('Viaggiare', 'repülőtér', 'l''aeroporto'),
    ('Viaggiare', 'jegy', 'il biglietto'),
    ('Famiglia', 'anya', 'la madre'),
    ('Famiglia', 'apa', 'il padre'),
    ('Famiglia', 'testvér', 'il fratello'),
    ('Cibo', 'kenyér', 'il pane'),
    ('Cibo', 'víz', 'l''acqua'),
    ('Cibo', 'alma', 'la mela')
) as v(category_name, hungarian, italian)
join public.categories c on c.name = v.category_name
where not exists (
  select 1
  from public.words w
  where w.category_id = c.id
    and w.hungarian = v.hungarian
    and w.italian = v.italian
);
