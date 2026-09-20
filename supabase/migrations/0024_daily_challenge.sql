-- Tages-Challenge: 10 Fragen der aktuellen Stufe, mindestens 80 % richtig; einmal je Tag Bonus-XP.
alter table public.daily_goals add column if not exists challenge_done boolean not null default false;
alter table public.learning_sessions add column if not exists is_challenge boolean not null default false;
