-- SAMPLE DEMO DATA. Run after schema.sql. Delete or replace from the admin panel later.
-- Image URLs are Unsplash photos; replace with your own product photos when ready.
insert into public.categories (name, slug, description, image_url, sort_order) values
 ('Living Room','living-room','Sofas, armchairs and tables','https://images.unsplash.com/photo-1493663284031-b7e3aefcdc2f?auto=format&fit=crop&w=900&q=80',1),
 ('Bedroom','bedroom','Beds, storage and bedside','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',2),
 ('Dining','dining','Tables and chairs','https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80',3),
 ('Furniture','furniture','Accent and storage pieces','https://images.unsplash.com/photo-1586023492125-27b2c045efeb?auto=format&fit=crop&w=900&q=80',4)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, sku, description, price, sale_price, stock, width_cm, height_cm, depth_cm, material, finish, is_featured, is_new, is_best_seller, is_demo)
select c.id, v.name, v.slug, v.sku, v.descr || ' (Sample product)', v.price, v.sale, v.stock, v.w, v.h, v.d, v.mat, v.fin, v.feat, v.isnew, v.best, true
from (values
 ('living-room','Arden Three-Seater Sofa','arden-sofa','FRM-SOF-001','Deep seat, solid timber frame and a woven ivory upholstery.',189000,null::numeric,8,220,85,95,'Beech frame, linen blend','Ivory',true,false,true),
 ('living-room','Lund Lounge Chair','lund-chair','FRM-CHR-002','A low, wide lounge chair with a curved walnut back.',74000,64000,12,78,80,82,'Walnut, wool bouclé','Natural',true,true,false),
 ('living-room','Orsa Coffee Table','orsa-table','FRM-TBL-003','Round solid oak top on a turned pedestal base.',46000,null,15,90,38,90,'Solid oak','Smoked',false,true,true),
 ('bedroom','Vale Upholstered Bed','vale-bed','FRM-BED-004','King-size bed with a tall padded headboard.',165000,null,6,200,120,215,'Plywood, fabric','Charcoal',true,false,true),
 ('bedroom','Noor Bedside Table','noor-bedside','FRM-BED-005','Single drawer bedside with a brass pull.',28000,null,20,45,52,40,'Walnut veneer, brass','Walnut',false,true,false),
 ('bedroom','Halden Wardrobe','halden-wardrobe','FRM-WRD-006','Three-door wardrobe with internal shelving.',142000,125000,4,180,210,60,'Engineered wood','Dark oak',false,false,false),
 ('dining','Kaya Dining Table','kaya-table','FRM-DIN-007','Seats six. Solid sheesham top with tapered legs.',118000,null,7,200,76,100,'Solid sheesham','Walnut',true,false,true),
 ('dining','Mira Dining Chair','mira-chair','FRM-DIN-008','Stackable chair with a curved back and cushioned seat.',17500,null,40,48,82,52,'Ash, fabric','Natural',false,true,false),
 ('furniture','Sora Sideboard','sora-sideboard','FRM-SID-009','Four-door sideboard with fluted fronts.',96000,null,5,180,75,40,'Oak veneer','Smoked oak',true,false,false),
 ('furniture','Tala Console Table','tala-console','FRM-CON-010','Slim hallway console with a lower shelf.',38000,null,0,110,78,32,'Ash, steel','Black',false,false,false)
) as v(cat, name, slug, sku, descr, price, sale, stock, w, h, d, mat, fin, feat, isnew, best)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

insert into public.product_images (product_id, url, is_primary, sort_order)
select p.id, v.url, true, 0 from (values
 ('arden-sofa','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'),
 ('lund-chair','https://images.unsplash.com/photo-1586023492125-27b2c045efeb?auto=format&fit=crop&w=1200&q=80'),
 ('orsa-table','https://images.unsplash.com/photo-1493663284031-b7e3aefcdc2f?auto=format&fit=crop&w=1200&q=80'),
 ('vale-bed','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
 ('noor-bedside','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
 ('halden-wardrobe','https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80'),
 ('kaya-table','https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80'),
 ('mira-chair','https://images.unsplash.com/photo-1586023492125-27b2c045efeb?auto=format&fit=crop&w=1200&q=80'),
 ('sora-sideboard','https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80'),
 ('tala-console','https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80')
) as v(slug, url) join public.products p on p.slug = v.slug
where not exists (select 1 from public.product_images i where i.product_id = p.id);
