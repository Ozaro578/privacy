-- 0009: Referenzdaten. Rechtsstand-Angaben: Werte für Klasse B (Ersterwerb) sind allgemein dokumentiert und werden als
--       'published' geführt; alle übrigen Klassen sind mit review_status 'needs_verification' hinterlegt und müssen vor
--       Freigabe fachlich gegen FeV/FahrschAusbO/Prüfungsrichtlinie geprüft werden (keine erfundenen Prüfungsregeln).
insert into public.licenses (code, name, base_class, vehicle_category, min_age_years, requires_theory_exam, requires_practical_exam, sort_order) values
  ('B',    'Klasse B (Pkw)',                         null, 'car',        18, true,  true,  10),
  ('B197', 'Klasse B mit Schlüsselzahl 197',         'B',  'car',        18, true,  true,  11),
  ('B78',  'Klasse B mit Schlüsselzahl 78 (Automatik)', 'B', 'car',     18, true,  true,  12),
  ('B96',  'Klasse B mit Schlüsselzahl 96',          'B',  'car',        18, false, false, 13),
  ('BE',   'Klasse BE (Pkw mit Anhänger)',           null, 'trailer',    18, false, true,  14),
  ('AM',   'Klasse AM (Kleinkrafträder)',            null, 'moped',      15, true,  true,  20),
  ('A1',   'Klasse A1 (Leichtkrafträder)',           null, 'motorcycle', 16, true,  true,  21),
  ('A2',   'Klasse A2',                              null, 'motorcycle', 18, true,  true,  22),
  ('A',    'Klasse A',                               null, 'motorcycle', 24, true,  true,  23),
  ('C1',   'Klasse C1',                              null, 'truck',      18, true,  true,  30),
  ('C1E',  'Klasse C1E',                             null, 'trailer',    18, false, true,  31),
  ('C',    'Klasse C',                               null, 'truck',      21, true,  true,  32),
  ('CE',   'Klasse CE',                              null, 'trailer',    21, true,  true,  33),
  ('D1',   'Klasse D1',                              null, 'bus',        21, true,  true,  40),
  ('D1E',  'Klasse D1E',                             null, 'trailer',    21, false, true,  41),
  ('D',    'Klasse D',                               null, 'bus',        24, true,  true,  42),
  ('DE',   'Klasse DE',                              null, 'trailer',    24, false, true,  43);

-- Prüfungsregeln Theorie -------------------------------------------------------------------
insert into public.rule_versions (rule_type, license_code, acquisition_kind, version, valid_from, payload, source, legal_basis_date, review_status, notes) values
  ('exam_theory', 'B', 'first', 1, '2024-01-01',
   '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "total_points": 110, "max_error_points": 10,
     "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null, "exam_languages": ["de","en","tr","ar","fr","es","it","pl","pt","ro","ru","el","hr"],
     "note": "Prüfungssprachen fachlich zu verifizieren; Zeitlimit in der Praxis nicht fest vorgegeben"}',
   'FeV Anlage 7 Nr. 1; Prüfungsrichtlinie (TÜV | DEKRA arge tp 21)', '2024-01-01', 'published', 'Klasse B Ersterwerb'),
  ('exam_theory', 'B', 'extension', 1, '2024-01-01',
   '{"questions_total": 20, "basic_questions": 10, "class_specific_questions": 10, "max_error_points": 6, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}',
   'FeV Anlage 7 Nr. 1 (Erweiterung)', '2024-01-01', 'needs_verification', 'Werte vor Freigabe prüfen'),
  ('exam_theory', 'A', 'first', 1, '2024-01-01', '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'A1', 'first', 1, '2024-01-01', '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'A2', 'first', 1, '2024-01-01', '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'AM', 'first', 1, '2024-01-01', '{"questions_total": 30, "basic_questions": 20, "class_specific_questions": 10, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'C', 'first', 1, '2024-01-01', '{"questions_total": 37, "basic_questions": 20, "class_specific_questions": 17, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'C1', 'first', 1, '2024-01-01', '{"questions_total": 37, "basic_questions": 20, "class_specific_questions": 17, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'CE', 'extension', 1, '2024-01-01', '{"questions_total": 20, "basic_questions": 10, "class_specific_questions": 10, "max_error_points": 6, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'D', 'first', 1, '2024-01-01', '{"questions_total": 37, "basic_questions": 20, "class_specific_questions": 17, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null),
  ('exam_theory', 'D1', 'first', 1, '2024-01-01', '{"questions_total": 37, "basic_questions": 20, "class_specific_questions": 17, "max_error_points": 10, "fail_if_two_five_point_questions_wrong": true, "time_limit_seconds": null}', 'FeV Anlage 7 Nr. 1', '2024-01-01', 'needs_verification', null);

-- Varianten von B erben die Theorieregeln (Lookup über base_class erfolgt in der Rules Engine)

-- Prüfungsregeln Praxis --------------------------------------------------------------------
insert into public.rule_versions (rule_type, license_code, acquisition_kind, version, valid_from, payload, source, legal_basis_date, review_status) values
  ('exam_practical', 'B', 'any', 1, '2021-01-01', '{"duration_minutes": 55, "min_driving_minutes": 25, "task_catalog": "Fahraufgabenkatalog", "electronic_protocol": true, "retry_wait_days": 14, "theory_validity_months": 12}', 'FeV Anlage 7 Nr. 2; Prüfungsrichtlinie', '2021-01-01', 'published'),
  ('exam_practical', 'BE', 'any', 1, '2021-01-01', '{"duration_minutes": 55, "min_driving_minutes": 25, "task_catalog": "Fahraufgabenkatalog", "retry_wait_days": 14}', 'FeV Anlage 7 Nr. 2', '2021-01-01', 'needs_verification'),
  ('exam_practical', 'A', 'any', 1, '2021-01-01', '{"duration_minutes": 60, "min_driving_minutes": 25, "retry_wait_days": 14}', 'FeV Anlage 7 Nr. 2', '2021-01-01', 'needs_verification'),
  ('exam_practical', 'C', 'any', 1, '2021-01-01', '{"duration_minutes": 75, "min_driving_minutes": 45, "retry_wait_days": 14}', 'FeV Anlage 7 Nr. 2', '2021-01-01', 'needs_verification');

-- Ausbildungsanforderungen (Sonderfahrten) -------------------------------------------------
insert into public.rule_versions (rule_type, license_code, acquisition_kind, version, valid_from, payload, source, legal_basis_date, review_status, notes) values
  ('training_requirements', 'B', 'first', 1, '2021-01-01',
   '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}, "min_practice_lessons": null, "notes": "Übungsstunden ohne gesetzliche Mindestanzahl; Umfang nach Ausbildungsstand"}',
   'FahrschAusbO § 5 und Anlage 4', '2021-01-01', 'published', 'Klasse B'),
  ('training_requirements', 'B197', 'first', 1, '2021-04-01',
   '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}, "manual_transmission_lessons_min": 10, "manual_test_drive_minutes": 15, "notes": "Schlüsselzahl 197: mindestens 10 Fahrstunden auf Schaltgetriebe und 15-minütige Testfahrt"}',
   'FahrschAusbO § 5a; FeV Anlage 9', '2021-04-01', 'published', 'Schlüsselzahl 197'),
  ('training_requirements', 'B78', 'first', 1, '2021-01-01',
   '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}, "automatic_only": true}',
   'FahrschAusbO § 5; FeV Anlage 9', '2021-01-01', 'published', 'Automatikbeschränkung'),
  ('training_requirements', 'BE', 'extension', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'A', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'A1', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'A2', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 4, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'AM', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'C', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 2, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'CE', 'extension', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 5, "motorway": 2, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'C1', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'C1E', 'extension', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'D', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 8, "motorway": 3, "night": 3}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'DE', 'extension', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'D1', 'first', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null),
  ('training_requirements', 'D1E', 'extension', 1, '2021-01-01', '{"unit_minutes": 45, "special_drives": {"overland": 3, "motorway": 1, "night": 1}}', 'FahrschAusbO Anlage 4', '2021-01-01', 'needs_verification', null);

-- Theorieunterricht (Doppelstunden à 90 Minuten) -------------------------------------------
insert into public.rule_versions (rule_type, license_code, acquisition_kind, version, valid_from, payload, source, legal_basis_date, review_status) values
  ('theory_lessons', 'B', 'first', 1, '2021-01-01',
   '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 2,
     "basic_unit_titles": ["Persönliche Voraussetzungen, Risikofaktor Mensch", "Rechtliche Rahmenbedingungen", "Verkehrszeichen und Verkehrseinrichtungen", "Straßenverkehrssystem und seine Nutzung", "Vorfahrt", "Verkehrsregelungen", "Geschwindigkeit, Abstand und umweltschonende Fahrweise", "Andere Teilnehmer im Straßenverkehr", "Verkehrsverhalten bei Fahrmanövern, Verkehrsbeobachtung", "Ruhender Verkehr", "Verhalten in besonderen Situationen, Folgen von Verstößen", "Lebenslanges Lernen, Fahrer und Fahrzeug"],
     "class_specific_unit_titles": ["Technische Bedingungen, Personen- und Güterbeförderung, umweltbewusster Umgang mit Kraftfahrzeugen", "Fahren mit Solokraftfahrzeugen und Zügen, Fahrzeugbeleuchtung, Sozialvorschriften"]}',
   'FahrschAusbO § 4 und Anlage 1, 2.1', '2021-01-01', 'published'),
  ('theory_lessons', 'B', 'extension', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 6, "class_specific_units": 2}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'A', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 4}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'A1', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 4}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'A2', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 4}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'AM', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 2}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'BE', 'extension', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 0, "class_specific_units": 4}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'C', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 10}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'CE', 'extension', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 6, "class_specific_units": 4}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification'),
  ('theory_lessons', 'D', 'first', 1, '2021-01-01', '{"unit_minutes": 90, "basic_units": 12, "class_specific_units": 18}', 'FahrschAusbO § 4', '2021-01-01', 'needs_verification');

-- Fahrkompetenzen (Praxis) -------------------------------------------------------------------
insert into public.skills (code, name_i18n, category, license_codes, sort_order) values
  ('vehicle_handling', '{"de": "Fahrzeugbedienung", "en": "Vehicle handling", "tr": "Araç kullanımı", "ar": "التحكم في المركبة"}', 'basic_tasks', '{}', 10),
  ('basic_tasks',      '{"de": "Grundfahraufgaben", "en": "Basic driving tasks", "tr": "Temel sürüş görevleri", "ar": "مهام القيادة الأساسية"}', 'basic_tasks', '{}', 11),
  ('emergency_braking','{"de": "Gefahrbremsung", "en": "Emergency braking", "tr": "Acil frenleme", "ar": "الفرملة الطارئة"}', 'basic_tasks', '{}', 12),
  ('parking',          '{"de": "Einparken", "en": "Parking", "tr": "Park etme", "ar": "ركن السيارة"}', 'basic_tasks', '{}', 13),
  ('observation',      '{"de": "Verkehrsbeobachtung", "en": "Traffic observation", "tr": "Trafik gözlemi", "ar": "مراقبة حركة المرور"}', 'traffic', '{}', 20),
  ('speed',            '{"de": "Geschwindigkeit", "en": "Speed", "tr": "Hız", "ar": "السرعة"}', 'traffic', '{}', 21),
  ('distance',         '{"de": "Abstand", "en": "Following distance", "tr": "Takip mesafesi", "ar": "مسافة الأمان"}', 'traffic', '{}', 22),
  ('turning',          '{"de": "Abbiegen", "en": "Turning", "tr": "Dönüş", "ar": "الانعطاف"}', 'traffic', '{}', 23),
  ('right_of_way',     '{"de": "Vorfahrt", "en": "Right of way", "tr": "Geçiş önceliği", "ar": "حق الأولوية"}', 'traffic', '{}', 24),
  ('roundabout',       '{"de": "Kreisverkehr", "en": "Roundabout", "tr": "Dönel kavşak", "ar": "الدوار"}', 'traffic', '{}', 25),
  ('lane_change',      '{"de": "Fahrstreifenwechsel", "en": "Lane change", "tr": "Şerit değiştirme", "ar": "تغيير المسار"}', 'traffic', '{}', 26),
  ('traffic_signs',    '{"de": "Verkehrszeichen und Lichtzeichen", "en": "Signs and signals", "tr": "Trafik işaretleri", "ar": "الإشارات المرورية"}', 'traffic', '{}', 27),
  ('vulnerable_users', '{"de": "Fußgänger und Radfahrer", "en": "Pedestrians and cyclists", "tr": "Yayalar ve bisikletliler", "ar": "المشاة وراكبو الدراجات"}', 'traffic', '{}', 28),
  ('overland',         '{"de": "Landstraße", "en": "Rural roads", "tr": "Kırsal yollar", "ar": "الطرق الريفية"}', 'special_drives', '{}', 30),
  ('motorway',         '{"de": "Autobahn", "en": "Motorway", "tr": "Otoyol", "ar": "الطريق السريع"}', 'special_drives', '{}', 31),
  ('night',            '{"de": "Fahren bei Dunkelheit", "en": "Night driving", "tr": "Gece sürüşü", "ar": "القيادة الليلية"}', 'special_drives', '{}', 32),
  ('eco_driving',      '{"de": "Umweltbewusstes Fahren", "en": "Eco driving", "tr": "Çevreci sürüş", "ar": "القيادة الصديقة للبيئة"}', 'eco', '{}', 40),
  ('independent',      '{"de": "Selbstständiges Fahren", "en": "Independent driving", "tr": "Bağımsız sürüş", "ar": "القيادة المستقلة"}', 'independent', '{}', 50),
  ('hazard_awareness', '{"de": "Gefahrenerkennung", "en": "Hazard awareness", "tr": "Tehlike farkındalığı", "ar": "إدراك المخاطر"}', 'independent', '{}', 51);

-- Themen (global) mit Kopplung zur Praxis-Kompetenz -----------------------------------------
insert into public.topics (code, name_i18n, material_kind, practical_skill_code, sort_order) values
  ('gefahrenlehre',       '{"de": "Gefahrenlehre und Risikofaktor Mensch", "en": "Hazard theory", "tr": "Tehlike teorisi", "ar": "نظرية الخطر"}', 'basic', 'hazard_awareness', 1),
  ('recht',               '{"de": "Fahrerlaubnis und Recht", "en": "Licensing and law", "tr": "Ehliyet ve hukuk", "ar": "الرخصة والقانون"}', 'basic', null, 2),
  ('verkehrszeichen',     '{"de": "Verkehrszeichen", "en": "Traffic signs", "tr": "Trafik işaretleri", "ar": "إشارات المرور"}', 'basic', 'traffic_signs', 3),
  ('strassenbenutzung',   '{"de": "Straßenbenutzung und Autobahn", "en": "Road use and motorway", "tr": "Yol kullanımı ve otoyol", "ar": "استخدام الطريق والطريق السريع"}', 'basic', 'motorway', 4),
  ('vorfahrt',            '{"de": "Vorfahrt", "en": "Right of way", "tr": "Geçiş önceliği", "ar": "حق الأولوية"}', 'basic', 'right_of_way', 5),
  ('verkehrsregelung',    '{"de": "Lichtzeichen und Verkehrsregelung", "en": "Signals and traffic control", "tr": "Işıklı işaretler", "ar": "الإشارات الضوئية"}', 'basic', 'traffic_signs', 6),
  ('geschwindigkeit',     '{"de": "Geschwindigkeit und Abstand", "en": "Speed and distance", "tr": "Hız ve mesafe", "ar": "السرعة والمسافة"}', 'basic', 'speed', 7),
  ('andere_teilnehmer',   '{"de": "Andere Verkehrsteilnehmer", "en": "Other road users", "tr": "Diğer trafik katılımcıları", "ar": "مستخدمو الطريق الآخرون"}', 'basic', 'vulnerable_users', 8),
  ('fahrmanoever',        '{"de": "Abbiegen, Überholen, Fahrstreifenwechsel", "en": "Turning, overtaking, lane change", "tr": "Dönüş, sollama, şerit değiştirme", "ar": "الانعطاف والتجاوز وتغيير المسار"}', 'basic', 'lane_change', 9),
  ('kreisverkehr',        '{"de": "Kreisverkehr", "en": "Roundabouts", "tr": "Dönel kavşaklar", "ar": "الدوارات"}', 'basic', 'roundabout', 10),
  ('halten_parken',       '{"de": "Halten und Parken", "en": "Stopping and parking", "tr": "Durma ve park etme", "ar": "التوقف وركن السيارة"}', 'basic', 'parking', 11),
  ('besondere_situationen','{"de": "Besondere Verkehrssituationen", "en": "Special situations", "tr": "Özel durumlar", "ar": "الحالات الخاصة"}', 'basic', 'hazard_awareness', 12),
  ('unfall_panne',        '{"de": "Unfall, Panne und Erste Hilfe", "en": "Accidents and breakdowns", "tr": "Kaza ve arıza", "ar": "الحوادث والأعطال"}', 'basic', null, 13),
  ('umwelt',              '{"de": "Umweltschonendes Fahren", "en": "Eco driving", "tr": "Çevreci sürüş", "ar": "القيادة الصديقة للبيئة"}', 'basic', 'eco_driving', 14),
  ('alkohol_drogen',      '{"de": "Alkohol, Drogen, Medikamente", "en": "Alcohol, drugs, medication", "tr": "Alkol, uyuşturucu, ilaç", "ar": "الكحول والمخدرات والأدوية"}', 'basic', null, 15),
  ('fahrzeugtechnik',     '{"de": "Fahrzeugtechnik und Sicherheitskontrollen", "en": "Vehicle technology", "tr": "Araç teknolojisi", "ar": "تقنية المركبة"}', 'class_specific', 'vehicle_handling', 20),
  ('beleuchtung',         '{"de": "Beleuchtung", "en": "Lighting", "tr": "Aydınlatma", "ar": "الإضاءة"}', 'class_specific', 'night', 21),
  ('befoerderung',        '{"de": "Personen- und Güterbeförderung, Anhänger", "en": "Passengers, cargo, trailers", "tr": "Yolcu, yük, römork", "ar": "الركاب والبضائع والمقطورات"}', 'class_specific', null, 22),
  ('fahrphysik',          '{"de": "Fahrphysik und Assistenzsysteme", "en": "Driving physics and assistance systems", "tr": "Sürüş fiziği", "ar": "فيزياء القيادة"}', 'class_specific', 'vehicle_handling', 23);

-- Abzeichen ---------------------------------------------------------------------------------
insert into public.badges (code, name_i18n, description_i18n, icon, criteria) values
  ('streak_7',   '{"de": "7 Tage gelernt", "en": "7-day streak"}', '{"de": "An sieben Tagen in Folge gelernt.", "en": "Studied seven days in a row."}', 'flame', '{"type": "streak_days", "value": 7}'),
  ('streak_30',  '{"de": "30 Tage gelernt", "en": "30-day streak"}', '{"de": "An dreißig Tagen in Folge gelernt.", "en": "Studied thirty days in a row."}', 'flame', '{"type": "streak_days", "value": 30}'),
  ('correct_100','{"de": "100 Fragen richtig", "en": "100 correct answers"}', '{"de": "Einhundert Fragen richtig beantwortet.", "en": "Answered one hundred questions correctly."}', 'target', '{"type": "correct_answers", "value": 100}'),
  ('correct_1000','{"de": "1000 Fragen richtig", "en": "1000 correct answers"}', '{"de": "Eintausend Fragen richtig beantwortet.", "en": "Answered one thousand questions correctly."}', 'target', '{"type": "correct_answers", "value": 1000}'),
  ('exams_passed_5','{"de": "5 Prüfungssimulationen bestanden", "en": "5 mock exams passed"}', '{"de": "Fünf Prüfungssimulationen bestanden.", "en": "Passed five exam simulations."}', 'trophy', '{"type": "exam_simulations_passed", "value": 5}'),
  ('topic_vorfahrt', '{"de": "Vorfahrt gemeistert", "en": "Right of way mastered"}', '{"de": "Mastery über 90 % im Thema Vorfahrt.", "en": "Mastery above 90 percent in right of way."}', 'star', '{"type": "topic_mastery", "topic": "vorfahrt", "value": 0.9}'),
  ('topic_geschwindigkeit', '{"de": "Geschwindigkeit gemeistert", "en": "Speed mastered"}', '{"de": "Mastery über 90 % im Thema Geschwindigkeit.", "en": "Mastery above 90 percent in speed."}', 'star', '{"type": "topic_mastery", "topic": "geschwindigkeit", "value": 0.9}'),
  ('topic_verkehrszeichen', '{"de": "Verkehrszeichen gemeistert", "en": "Traffic signs mastered"}', '{"de": "Mastery über 90 % im Thema Verkehrszeichen.", "en": "Mastery above 90 percent in traffic signs."}', 'star', '{"type": "topic_mastery", "topic": "verkehrszeichen", "value": 0.9}');

-- Dokumenten-Checkliste (Plattform-Vorlage; Fahrschulen können überschreiben) ---------------
insert into public.document_requirements (code, name_i18n, description_i18n, license_codes, required, requires_upload, applies_when, sort_order) values
  ('registration',          '{"de": "Anmeldung / Ausbildungsvertrag", "en": "Registration / training contract"}', '{"de": "Unterschriebener Ausbildungsvertrag mit der Fahrschule."}', '{}', true, false, '{}', 1),
  ('id_copy',               '{"de": "Ausweiskopie", "en": "ID copy"}', '{"de": "Personalausweis oder Reisepass (Vorder- und Rückseite)."}', '{}', true, true, '{}', 2),
  ('passport_photo',        '{"de": "Biometrisches Passfoto", "en": "Biometric passport photo"}', '{"de": "Aktuelles biometrisches Lichtbild für den Führerscheinantrag."}', '{}', true, true, '{}', 3),
  ('eye_test',              '{"de": "Sehtest", "en": "Eye test"}', '{"de": "Sehtestbescheinigung einer amtlich anerkannten Sehteststelle (Gültigkeit fachlich zu prüfen)."}', '{}', true, true, '{}', 4),
  ('first_aid',             '{"de": "Erste-Hilfe-Nachweis", "en": "First aid certificate"}', '{"de": "Teilnahmebescheinigung Erste-Hilfe-Kurs."}', '{}', true, true, '{}', 5),
  ('authority_application', '{"de": "Antrag Fahrerlaubnisbehörde", "en": "Licensing authority application"}', '{"de": "Antrag bei der Führerscheinstelle gestellt (Bearbeitungszeit beachten)."}', '{}', true, false, '{}', 6),
  ('guardian_consent',      '{"de": "Einverständnis Erziehungsberechtigte", "en": "Guardian consent"}', '{"de": "Bei Minderjährigen: Einverständniserklärung der Erziehungsberechtigten."}', '{}', true, true, '{"minor": true}', 7),
  ('bf17_companions',       '{"de": "Begleitpersonen (BF17)", "en": "Accompanying persons (BF17)"}', '{"de": "Angaben zu Begleitpersonen für das begleitete Fahren ab 17."}', '{"B","B197","B78"}', true, false, '{"accompanied_driving": true}', 8);

-- Aufbewahrungsvorgaben (Plattform-Default, fachlich zu verifizieren außer Rechnungen) --------
insert into public.retention_policies (tenant_id, data_category, retention_months, legal_basis, review_status) values
  (null, 'invoices', 120, '§ 147 AO, § 257 HGB (10 Jahre)', 'published'),
  (null, 'training_records', 36, 'FahrschAusbO Ausbildungsnachweis (Frist zu verifizieren)', 'needs_verification'),
  (null, 'learning_data', 24, 'Berechtigtes Interesse; Löschung nach Ausbildungsende', 'needs_verification'),
  (null, 'messages', 24, 'Berechtigtes Interesse', 'needs_verification'),
  (null, 'audit_logs', 36, 'Nachweispflichten, Art. 5 Abs. 2 DSGVO', 'needs_verification'),
  (null, 'documents', 24, 'Löschung nach Zweckerfüllung', 'needs_verification');
