# 体动健身房约课小程序

## 用户需求

会员端：
- 看本周课程表（课程、时间、剩余名额），一键预约和取消
- 看教练资料（擅长方向、可约时段），预约私教课
- 查自己的预约记录（团课 + 私教）

管理端：
- 发布课程、设置名额
- 查看每节课的报名名单

## 技术约束

- Taro 4 + React + TypeScript（平台强约束）
- H5 预览（5173）
- Supabase 持久化（匿名模式，无登录流程）
- 不使用 @supabase/supabase-js（weapp 不支持 fetch/localStorage），所有数据访问通过 Taro.request 调 PostgREST
- 遵循微信小程序开发规范

## 默认决策（待确认问题）

- **会员端 / 管理端角色**：本地 member 自带 role 字段（member/admin），首页可切换；admin 才能进入管理端
- **课程发布关键字段**：名称、教练、星期、起止时间、地点、最大名额、难度等级
- **取消预约规则**：开课前 2 小时可免费取消（默认推荐项）
- **私教预约流程**：直接选择教练可约时段提交预约，状态进入「待教练确认」（默认推荐项 + 管理端可确认）

## 数据模型

- members(id text, name, phone, role, created_at)
- coaches(id uuid, name, specialty, bio, available_slots jsonb, avatar, created_at)
- courses(id uuid, name, coach_id, day_of_week, start_time, end_time, location, max_capacity, difficulty, created_at)
- bookings(id uuid, course_id, member_id, member_name, status(booked/cancelled), created_at, unique(course_id, member_id))
- private_bookings(id uuid, coach_id, member_id, member_name, slot, note, status(pending/confirmed/cancelled), created_at)

RLS：anonymous-app baseline，所有表对 anon 角色开放 CRUD。
