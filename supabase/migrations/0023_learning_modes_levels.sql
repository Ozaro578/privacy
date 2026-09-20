-- Neue Lernmodi: Stufen-Modus (ladder, leicht nach schwer) und Zeichen-Trainer (signs).
alter type app.learning_mode add value if not exists 'ladder';
alter type app.learning_mode add value if not exists 'signs';
