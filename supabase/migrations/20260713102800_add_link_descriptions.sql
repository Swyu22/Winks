-- Optional, compact functional summary shown between a link title and its tags.
alter table public.links
  add column if not exists description text;

with descriptions (id, description) as (
  values
    ('f7a9b505-346d-4886-b2d1-bd6724d754af'::uuid, 'AI图像放大增强工具'),
    ('05863309-4bb3-43f6-b0d2-0fcdf5d9d6d3'::uuid, '音视频转写分析工具'),
    ('c7bcd26d-3d19-479d-907e-2d7fe5d93303'::uuid, '智能文字转语音工具'),
    ('b5e5e1ad-3956-46c0-938f-cc131d796183'::uuid, 'AI语音生成创作平台'),
    ('dc709b06-c381-4f2d-bf1b-2418f6361d0e'::uuid, '与众内部办公协作平台'),
    ('32ec874a-ae35-416a-b73d-1b59d61c5092'::uuid, 'GPT图像应用教程合集'),
    ('c8808245-b866-4220-8954-f1cdf08575c3'::uuid, '腾讯供应商结算平台'),
    ('84270a03-f757-4290-8318-77f5dceddc3d'::uuid, '腾讯供应商招投标门户'),
    ('81669ae7-b93b-4242-8446-99edb0a1dd7d'::uuid, '在线图片设计编辑工具'),
    ('e0a721d7-e1c3-4af2-bdf3-8e65e6c73cb0'::uuid, '专业AI视频创作工具'),
    ('f87adb81-a75e-4ed6-b9a2-9d41dfa34665'::uuid, '年度热门宣传片案例'),
    ('dfeadc9f-d72e-41c7-b39a-fb1cfdf35bcf'::uuid, 'AI无限画布创作工具'),
    ('12f9f490-4cc4-4f2c-8299-3b4acea1fa7c'::uuid, 'AI模型接口聚合平台'),
    ('bc88cd5a-142f-4ce5-aa40-021b0575bbb7'::uuid, '抖音KV海报案例合集'),
    ('eba6a369-a787-48cb-9999-2f3b3c98a7d7'::uuid, 'AI提示词资源库'),
    ('22f89d89-b6b5-4ff8-af21-c11965e02fb0'::uuid, 'Seedance使用手册'),
    ('26290b7a-2d60-4cfd-8a81-68833640c15b'::uuid, 'Figma汉化版下载指南'),
    ('3dd1470c-5a45-4aeb-8971-2893e5622510'::uuid, '浏览器网络访问辅助插件'),
    ('133b96b8-c22b-4e0d-b9b7-d73c0b52562f'::uuid, '人声伴奏分离工具'),
    ('26ae2f25-f0cd-4ea9-ba97-62f0d9488927'::uuid, 'AI图像生成创作平台'),
    ('2d3f347b-1668-4d50-9fa8-a0cb886d6f31'::uuid, 'AI视频生成创作平台'),
    ('2ce13c7b-824f-4bd6-9ce3-4e2eb91383b8'::uuid, 'AI图像视频创作平台'),
    ('51cd6b06-b4b1-455a-89ec-1691d5c1a269'::uuid, 'AI图像视频创作工具'),
    ('a6e04d9e-ce1a-4c49-b7dd-40d29770bdaf'::uuid, '产品设计协作交付平台'),
    ('d76b87db-9245-4940-abb6-030487d893cf'::uuid, '国际版AI语音生成平台'),
    ('27138a7d-42a7-4750-b09f-3638a7bef2e7'::uuid, '在线协作界面设计工具'),
    ('bdb7e1a6-cbea-4d2f-9a0e-40293b119ba7'::uuid, '音视频审阅协作平台'),
    ('5ebe7d1c-5236-4f2e-93da-36540761ea54'::uuid, '达芬奇调色教程合集'),
    ('c84d27c4-65a6-4ae3-bbfd-499cfe7df61b'::uuid, '深度推理AI智能助手'),
    ('092d36ef-1abc-46f3-b1ff-e60e1b61a9a2'::uuid, '与众站酷设计作品集'),
    ('c2197c16-511d-49c0-b753-b526ab855ad5'::uuid, '与众新片场影视作品集'),
    ('a3313564-3d10-4219-9072-4f72d762d4c2'::uuid, '与众创意作品展示官网'),
    ('23fe37b9-9e44-467f-b197-f6e119b3007f'::uuid, '多模态AI智能助手'),
    ('79a61872-1d0c-4939-afde-400446baa267'::uuid, '通用型AI智能助手'),
    ('cddab4e5-e1e0-46cb-9570-b36902546e81'::uuid, 'AI设计创作智能体'),
    ('ce09e24c-32ea-4471-ab35-b792bf8f9a51'::uuid, '高频文本素材管理工具')
)
update public.links as link
set description = descriptions.description
from descriptions
where link.id = descriptions.id;

alter table public.links
  drop constraint if exists links_description_check;

alter table public.links
  add constraint links_description_check check (
    description is null
    or (
      description = btrim(description)
      and char_length(description) between 1 and 15
    )
  );

comment on column public.links.description is
  'Optional single-line functional summary; trimmed and limited to 15 characters.';
