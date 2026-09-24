// Concise, source-checked department cards. Game settings are for SCP:SL only.
window.DEPARTMENT_EVENTS = {
  "nr": [
    {"id":"global-d-block","title":"Битва за Д-блок","type":"global","code":"ГЛОБАЛЬНЫЙ ИВЕНТ","rank":"master","summary":"Матч в D-блоке с отдельными стартовыми камерами.","tech":[["Старт","По одному игроку в камере"],["Подготовка","Выход из D-блока закрыт"],["Формат","2–3 раунда"]],"rules":["Сначала выдай экипировку и объяви обратный отсчёт.","Двери открываются по команде проводящего; при необходимости проведи финал победителей."],"source":"https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.b2s330n80v5z"},
    {
      "id": "global-mog-chaos",
      "title": "МОГ против ПХ",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Командный матч МОГ и Повстанцев Хаоса в трёх зонах комплекса.",
      "tech": [
        [
          "Этапы",
          "3 раунда: ЛЗС, ТЗС, офисная зона"
        ],
        [
          "Состав",
          "Две равные команды"
        ],
        [
          "Подготовка",
          "1 минута на обсуждение тактики"
        ]
      ],
      "rules": [
        "Комплект игрового снаряжения выбирается голосованием.",
        "Победитель определяется в финале внутри выигравшей команды."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.nij4yp9ucoyx"
    },
    {
      "id": "global-hide-dogs",
      "title": "Прятки от собак",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игроки прячутся от SCP-939; выбывшие присоединяются к поиску.",
      "tech": [
        [
          "Старт",
          "D-класс и 2 SCP-939"
        ],
        [
          "Формат",
          "3 раунда, 3 зоны"
        ],
        [
          "Фора",
          "1 минута на укрытие"
        ]
      ],
      "rules": [
        "Вариант со светом или без него выбирают игроки. В темноте нужны фонари.",
        "Победитель — последний оставшийся участник за D-класс."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.50xo0pykcvas"
    },
    {
      "id": "global-ghetto",
      "title": "Гетто-перестрелка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Две команды с капитанами разыгрывают серию матчей.",
      "tech": [
        [
          "Команды",
          "D-класс и научные сотрудники"
        ],
        [
          "Этапы",
          "3 раунда со сменой капитанов"
        ],
        [
          "Капитан",
          "FSP-9, лёгкая броня, 170 HP"
        ]
      ],
      "rules": [
        "Остальные участники получают пистолеты, кроме револьвера, и аптечки.",
        "Если раунд длится больше 8 минут, появляется группа полиции; её победа означает ничью."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.ewfu66q7vx5d"
    },
    {
      "id": "global-jailbird",
      "title": "Битва на палках",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Три игровых арены и состязание с Jailbird до последнего участника.",
      "tech": [
        [
          "Роль",
          "D-класс"
        ],
        [
          "Этапы",
          "3 раунда на разных площадках"
        ],
        [
          "Инвентарь",
          "2 Jailbird каждому"
        ]
      ],
      "rules": [
        "Перед стартом дай время разойтись по площадке.",
        "Friendly Fire включается только после подготовки участников."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.8p7akf1y5ho"
    },
    {
      "id": "global-bombardment",
      "title": "Бомбардировка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Арена с игровыми препятствиями, сложность которой постепенно растёт.",
      "tech": [
        [
          "Площадки",
          "Боеголовка, комната SCP-106 или SCP-049/173"
        ],
        [
          "Подготовка",
          "Ограничить выходы и лифты"
        ],
        [
          "SCP-018",
          "Не более 2 активных одновременно"
        ]
      ],
      "rules": [
        "В начале сценария нельзя выбирать одного игрока постоянной целью.",
        "Темп и длительность этапов сверяй с вариантом своего сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.93l9f0bewcdp"
    },
    {
      "id": "global-tracker",
      "title": "Ищейка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Поиск спрятанных ключ-карт в трёх зонах комплекса.",
      "tech": [
        [
          "Зоны",
          "ТЗС, ЛЗС, поверхность"
        ],
        [
          "Тайники",
          "По 5 чёрных карт на зону"
        ],
        [
          "Раунды",
          "1"
        ]
      ],
      "rules": [
        "Перед размещением карт очисти зоны от лишних предметов.",
        "Выигрывает участник, собравший больше карт; при равенстве нужен дополнительный этап."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.cti55mw8glii"
    },
    {
      "id": "global-hunger-games",
      "title": "Голодные игры",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игроки ищут снаряжение на подготовленной арене и соревнуются за победу.",
      "tech": [
        [
          "Роль",
          "D-класс"
        ],
        [
          "Формат",
          "Одиночный или командный"
        ],
        [
          "Арена",
          "Зона на выбор организатора"
        ]
      ],
      "rules": [
        "Предметы раскладываются до появления участников.",
        "Помощники, которые знают размещение предметов, в матче не участвуют."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.3va6mk4hp0ai"
    },
    {
      "id": "global-scp-waves",
      "title": "Волны SCP",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Противостояние людей и SCP с усилением обеих сторон между волнами.",
      "tech": [
        [
          "Волны NR",
          "5"
        ],
        [
          "Старт SCP",
          "ЛЗС: PT-00, SCP-914 или КПП"
        ],
        [
          "Старт людей",
          "ТЗС или ЛЗС"
        ]
      ],
      "rules": [
        "После каждой волны меняй роли и поддерживай равные шансы сторон.",
        "В NR ЛЗС закрывается через 3 минуты; затянувшийся этап сопровождается объявлением позиций после 10 минут."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.sbbg8td4gnuz"
    },
    {
      "id": "global-cube",
      "title": "Куб",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Совместное исследование комплекса: за следующей дверью может быть находка или испытание.",
      "tech": [
        [
          "Старт",
          "D-класс в D-блоке; двери закрыты"
        ],
        [
          "Ключ-карты",
          "Доступ через КПП и гейты"
        ],
        [
          "SCP-500 / рация",
          "Возвращение участника / разведка комнаты"
        ]
      ],
      "rules": [
        "Игроки вместе выбирают следующую дверь.",
        "Содержимое комнат и награды подбираются под текущую зону и снаряжение команды."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.f4rd7rpl9mu1"
    },
    {
      "id": "global-scp-defense",
      "title": "Защита карманных SCP объектов",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Одна команда охраняет SCP-предметы, другая переносит их на свою базу.",
      "tech": [
        [
          "Команды",
          "Учёные / D-класс либо МОГ / ПХ"
        ],
        [
          "Формат",
          "1 раунд"
        ],
        [
          "База",
          "Гейт или интерком"
        ]
      ],
      "rules": [
        "MicroHID, TMP, Jailbird и SCP-127 не входят в разрешённое снаряжение.",
        "По истечении времени считают предметы у команд. Награда за этот сценарий не предусмотрена."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.9cdhw5s3in8v"
    },
    {
      "id": "global-duels",
      "title": "Дуэли",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Турнир парных игровых поединков по сетке.",
      "tech": [
        [
          "Арена",
          "Предпочтительно поверхность"
        ],
        [
          "Участники",
          "По двое, остальные наблюдают"
        ],
        [
          "Снаряжение",
          "По договорённости участников"
        ]
      ],
      "rules": [
        "Объясни порядок старта и включи Friendly Fire для арены.",
        "Победитель пары переходит дальше по турнирной сетке."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.vt1auvecoy5u"
    },
    {
      "id": "global-juggernaut",
      "title": "Джаггернаут",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Команда против одного усиленного игрового персонажа.",
      "tech": [
        [
          "Роль босса",
          "Охранник без стандартного инвентаря"
        ],
        [
          "Параметры",
          "SET HP / SET MAX 3000; scale 1.1"
        ],
        [
          "Эффект",
          "Slowness 15"
        ],
        [
          "Рекомендуемый онлайн",
          "25–30 игроков"
        ]
      ],
      "rules": [
        "У босса нет брони. Комплекты экипировки сторон заданы в источнике.",
        "Стартовые позиции сторон должны быть разнесены."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.neyhyq57w5ep"
    },
    {
      "id": "global-werewolf",
      "title": "Оборотень",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "lead",
      "summary": "Игра со скрытой ролью и сменой дня и ночи. Сценарий руководства NR.",
      "tech": [
        [
          "День / ночь",
          "3 / 5 минут"
        ],
        [
          "Локация",
          "ЛЗС с закрытыми выходами"
        ],
        [
          "Жизни",
          "По одной на игрока"
        ]
      ],
      "rules": [
        "Заранее объясни смену фаз, правила общения и условия завершения.",
        "Выбывшие переходят в наблюдение и не раскрывают скрытую роль."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.6frcrroegwdr"
    },
    {
      "id": "global-quarantine",
      "title": "Поветрие",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игровой карантин: найди SCP-500 и успей добраться до убежища.",
      "tech": [
        [
          "Лимит",
          "10 минут"
        ],
        [
          "Старт",
          "Учёные на поверхности с зелёной картой"
        ],
        [
          "Убежище",
          "Бункер в компьютерной комнате"
        ]
      ],
      "rules": [
        "Доступ в убежище проверяют два охранника.",
        "После первых 2–3 минут появляются два SCP-049; в убежище SCP не входят."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.bsz7hlnyan9w"
    },
    {
      "id": "global-party",
      "title": "Смертельная вечеринка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Последовательность коротких игровых испытаний с одним итоговым победителем.",
      "tech": [
        [
          "Формат",
          "Серия мини-игр"
        ],
        [
          "Этапы",
          "Поиск предмета, гонка, прятки и другие задания"
        ],
        [
          "Победитель",
          "Один участник"
        ]
      ],
      "rules": [
        "Объясняй задание перед каждым этапом.",
        "Подбор этапов и спорные ситуации согласовывай с руководством."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.uqqcwj1uwj15"
    },
    {
      "id": "global-samurai",
      "title": "Битва самураев",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Две команды с одинаковым игровым снаряжением проходят три арены.",
      "tech": [
        [
          "Стороны",
          "МОГ / ПХ или учёные / D-класс"
        ],
        [
          "Этапы",
          "ЛЗС, офисная зона, поверхность"
        ],
        [
          "Инвентарь",
          "Мачете, игровая антикола и аптечка"
        ]
      ],
      "rules": [
        "Команды должны быть равными по числу игроков.",
        "После командной части проводится финал среди победивших."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.dtmyv5nti80q"
    },
    {
      "id": "global-jurassic",
      "title": "Парк Юрского периода",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Командный игровой режим с динозаврами в тяжёлой и офисной зонах.",
      "tech": [
        [
          "Динозавры NR",
          "Movement Boost 10; 1 HP"
        ],
        [
          "Люди",
          "D-класс; E11-SR, средняя броня, карта менеджера зоны, аптечка"
        ],
        [
          "Этапы",
          "2 раунда"
        ]
      ],
      "rules": [
        "Закрой лифты в ЛЗС и к SCP-049/173.",
        "Динозавров должно быть немного меньше. Корректируй баланс, если одна сторона постоянно выигрывает."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.r01gwlc399k4"
    },
    {
      "id": "global-olympics",
      "title": "Олимпийские игры",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Команды выбирают представителей для игровых состязаний внутри SCP:SL.",
      "tech": [
        [
          "Участие",
          "Один представитель команды на этап"
        ],
        [
          "Счёт",
          "1 балл за выигранный этап"
        ],
        [
          "Примеры",
          "Гонка SCP-939, задание с SCP-914, меткость"
        ]
      ],
      "rules": [
        "Объяви условия до начала состязания и веди общий счёт.",
        "Награды получают участники этапов согласно итоговым баллам."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.6g4l5zrgyov3"
    },
    {
      "id": "global-reboot",
      "title": "Перезагрузка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Раунд в темноте, где включение генераторов открывает следующие этапы.",
      "tech": [
        [
          "Начало",
          "D-блок; освещение выключено"
        ],
        [
          "Первый генератор",
          "SET MAX 200 для людей"
        ],
        [
          "Второй / третий",
          "Следующий комплект снаряжения / финальный этап"
        ]
      ],
      "rules": [
        "Число SCP зависит от онлайна: 1 при 15–19, 2 при 20–24, 3 при 25–35 и 4 при 36+.",
        "В начале SCP не заходят в ЛЗС 2 минуты; отключать генераторы и постоянно охранять их нельзя."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.xozvpbqz9eic"
    },
    {
      "id": "global-draw",
      "title": "Жребий",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Арена с короткими сменяющимися этапами и финалом для оставшихся участников.",
      "tech": [
        [
          "Роль и зона",
          "D-класс, камера SCP-173"
        ],
        [
          "Формат",
          "4 раунда"
        ],
        [
          "Смена этапа",
          "Предварительное объявление проводящего"
        ]
      ],
      "rules": [
        "Начинай с пустыми инвентарями участников.",
        "Ограничения игрового снаряжения различаются у NR и Classic — сверяй выбранную вкладку."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.jpn0y8fazm8d"
    },
    {
      "id": "angel-demon",
      "title": "Демон и ангел",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Два персонажа выполняют игровые пожелания с разными условиями.",
      "tech": [
        [
          "Роли",
          "Демон — D-класс; ангел — учёный"
        ],
        [
          "Пожелания",
          "Одно за жизнь участника"
        ],
        [
          "Лимиты",
          "Эффекты до 20; масштаб 0.8–1.2"
        ]
      ],
      "rules": [
        "Не выдавай административные возможности и не меняй состояние всего сервера.",
        "Максимум HP: у демона 500, у ангела 300. Дополнительные ограничения зависят от роли."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.gv3mxh81boyh"
    },
    {
      "id": "pink-glasses",
      "title": "Мир в розовых очках",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Модификатор обычного раунда из каталога отдела.",
      "tech": [
        [
          "Формат",
          "Мини-ивент"
        ],
        [
          "Статус",
          "Зависит от сервера"
        ]
      ],
      "rules": [
        "Карточка содержит только сведения о наличии сценария; подробный план здесь не размещён."
      ],
      "source": null,
      "disabled": true,
      "referenceOnly": true
    },
    {
      "id": "tiny-fixiks",
      "title": "Приключение фиксиков",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Обычный раунд, в котором модели всех участников становятся меньше.",
      "tech": [
        [
          "Масштаб",
          "0.3 / 0.3 / 0.3"
        ],
        [
          "Контроль",
          "Повторять настройку каждые 10 секунд в начале раунда"
        ],
        [
          "Новые волны",
          "Получают тот же масштаб"
        ]
      ],
      "rules": [
        "В первые 5 минут проверяй, что изменение применилось ко всем."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.z7yj7089dlzo",
      "disabled": true
    },
    {
      "id": "restaurant",
      "title": "Ресторан роллов Ёбидаёби",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игровой ресторан принимает заказы по рации и обменивает предметы на наборы.",
      "tech": [
        [
          "Реквизит",
          "Рация как телефон"
        ],
        [
          "Обмен",
          "Один игровой предмет за набор"
        ],
        [
          "Лимиты",
          "До 500 HP; эффекты до 20; масштаб 0.8–1.2"
        ]
      ],
      "rules": [
        "Меню и состав наборов объясни до начала обменов.",
        "Не выдавай GodMode, Noclip, Bypass и не вмешивайся в работу сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.z6e7wimm1zwg"
    },
    {
      "id": "lucky-coin",
      "title": "Монеточка удачи",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Аномальный персонаж исполняет игровые пожелания с непредсказуемым результатом.",
      "tech": [
        [
          "Пожелание",
          "Объявляется заранее"
        ],
        [
          "Масштаб",
          "0.8–1.2"
        ],
        [
          "Смена имени",
          "Только для обратившегося участника"
        ]
      ],
      "rules": [
        "Изменения ролей и перемещения ограничены сценарием.",
        "Не выдавай административные возможности и не меняй состояние всего сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.katbizcmef4k"
    },
    {
      "id": "family-walk",
      "title": "Семейная прогулка",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игроки выбирают прогулку семейства SCP-939 или группы маленьких SCP-173.",
      "tech": [
        [
          "SCP-939",
          "Взрослый и 2 щенка"
        ],
        [
          "Щенки",
          "Масштаб 0.5–0.7; до 750 HP; Heavy Footed 50–65"
        ],
        [
          "SCP-173",
          "4 участника; 2250 HP; Slowness 20; масштаб 0.6"
        ]
      ],
      "rules": [
        "Вариант выбирается голосованием.",
        "Уменьшенные SCP-173 держатся в одной зоне или перемещаются минимум парами."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.ewdnn965348e"
    },
    {
      "id": "cosmonaut",
      "title": "День космонавтики",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Модификатор движения с низкой гравитацией для обычного раунда.",
      "tech": [
        [
          "Всем",
          "LightWeight 185; Movement Boost 30"
        ],
        [
          "Только SCP",
          "Invigorated"
        ]
      ],
      "rules": [
        "Проверяй наличие эффектов у всех участников, включая новые появления."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.lh3kom6rmud0"
    },
    {
      "id": "echolocation",
      "title": "Эхолокация",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Право говорить через глобальный интерком переходит между игроками.",
      "tech": [
        [
          "Обычный онлайн",
          "4 случайных участника"
        ],
        [
          "Менее 15 игроков",
          "2 участника"
        ]
      ],
      "rules": [
        "Регулярно меняй участников, чтобы возможность получили разные игроки.",
        "В источнике расходятся интервалы 1 и 2 минуты: длительность уточни до запуска."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.t0un5kt0kv8f"
    },
    {
      "id": "fixik",
      "title": "Фиксик",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Маленький персонаж прячется в комплексе и награждает нашедших его.",
      "tech": [
        [
          "Проводящий",
          "Масштаб 0.1 / 0.1 / 0.1"
        ],
        [
          "Награда",
          "Случайный игровой предмет"
        ],
        [
          "Окончание",
          "Активация боеголовки"
        ]
      ],
      "rules": [
        "Нельзя повышать максимальное HP; обычное HP ограничено 250.",
        "Эффекты — до 20, изменение масштаба получателя — в пределах 0.8–1.2."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.txkriqr3e62p"
    },
    {
      "id": "court",
      "title": "Суд",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "master",
      "summary": "Короткая сценка с судьёй, защитником и участником игрового разбирательства.",
      "tech": [
        [
          "Роли",
          "Проводящий — судья; наблюдатель — защитник"
        ],
        [
          "Класс участников",
          "Обучение, без сброса инвентаря и позиции"
        ],
        [
          "Площадки",
          "PT-00 → MicroHID → интерком"
        ]
      ],
      "rules": [
        "По итогу проигравший теряет игровой инвентарь.",
        "Награда человеку: Jailbird и SET HP 200; SCP восстанавливает 300 HP."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.nug9cw5od6na"
    },
    {
      "id": "speed",
      "title": "Ускорение",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Весь раунд проходит с одинаковым бонусом скорости.",
      "tech": [
        [
          "Эффект",
          "Movement Boost 50"
        ],
        [
          "Получатели",
          "Все участники"
        ]
      ],
      "rules": [
        "Применяй эффект и к новым волнам МОГ, ПХ и D-класса."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.oizr855rpsx"
    },
    {
      "id": "shop",
      "title": "Магазин «Эльдорадо»",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Участники собирают игровые монеты и обменивают их в магазине.",
      "tech": [
        [
          "Монеты",
          "Размещаются в ТЗС в начале"
        ],
        [
          "Магазин",
          "Оружейная SCP-049"
        ],
        [
          "Цены",
          "От 1 до 6 игровых монет"
        ]
      ],
      "rules": [
        "Закрепи двери площадки в нужном состоянии до открытия.",
        "Категории товаров и их цены зафиксированы в исходном меню."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.4ew6yv50uvb2"
    },
    {
      "id": "questions",
      "title": "Нежеланные вопросы",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Викторина с тремя уровнями сложности и игровыми наградами.",
      "tech": [
        [
          "Подготовка",
          "Не менее 10 вопросов"
        ],
        [
          "Начало",
          "Через 3 минуты после старта раунда"
        ],
        [
          "Темп",
          "Один новый участник в минуту"
        ]
      ],
      "rules": [
        "Не приглашай повторно уже ответивших игроков.",
        "Можно использовать вопросы с вариантами ответа; подготовь ответы заранее."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.u2ihn0styikl"
    },
    {
      "id": "airdrop",
      "title": "Аир дроп",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "В комплексе последовательно появляются семь объявленных наборов припасов.",
      "tech": [
        [
          "Первое появление",
          "Через 2 минуты от начала"
        ],
        [
          "Интервал",
          "2 минуты между наборами"
        ],
        [
          "Оповещение",
          "Глобальный интерком"
        ]
      ],
      "rules": [
        "Место выбирает проводящий и сообщает его участникам.",
        "Содержимое семи наборов и порядок выдачи заданы в исходнике."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.7ldoz5flhiuq"
    },
    {
      "id": "baby",
      "title": "Кроха",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Дружелюбная мини-версия SCP-049 сопровождает обычный раунд.",
      "tech": [
        [
          "Участник",
          "Выбранный игрок за SCP-049"
        ],
        [
          "Масштаб",
          "0.6 / 0.6 / 0.6"
        ],
        [
          "Здоровье",
          "1200 HP"
        ]
      ],
      "rules": [
        "Изначально персонаж дружелюбен.",
        "Ответные действия допускаются только в рамках описанных в сценарии ситуаций."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.menaj3ubsn1q"
    },
    {
      "id": "mercenary",
      "title": "Наемник",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игровой посредник принимает запросы на информацию и действия внутри раунда.",
      "tech": [
        [
          "Формат",
          "Обмен игровых предметов на услуги"
        ],
        [
          "Местоположение",
          "Сообщается через общий Broadcast"
        ],
        [
          "Перемещение",
          "В соседнюю с целью комнату"
        ]
      ],
      "rules": [
        "Сценарий различает запросы, направленные на людей и на SCP.",
        "Перед изменением параметров участника ему нужно отправить игровое уведомление."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.tbdyw8khxery"
    },
    {
      "id": "trust",
      "title": "Доверяй, но проверяй",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "К обычному составу SCP присоединяются дополнительные SCP-3114.",
      "tech": [
        [
          "NR: 10–25 игроков",
          "1 SCP-3114; возможна замена одного обычного SCP"
        ],
        [
          "NR: 26–36",
          "2 SCP-3114 без дополнительных замен"
        ],
        [
          "NR: 37–60",
          "2–3 SCP-3114; возможна замена"
        ]
      ],
      "rules": [
        "Выбирай участников из игроков, а не назначай проводящих.",
        "Количество и возможность замены зависят от выбранного сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.djmmjerosw81"
    },
    {
      "id": "wanted",
      "title": "Розыск",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "master",
      "summary": "Один участник пытается продержаться до конца таймера, остальные ищут его.",
      "tech": [
        [
          "Фора",
          "15 секунд"
        ],
        [
          "Поиск",
          "2 минуты"
        ],
        [
          "Между этапами",
          "15–45 секунд"
        ]
      ],
      "rules": [
        "Участник получает маркер «Обучение» без смены позиции и сброса инвентаря.",
        "SCP не назначаются разыскиваемыми; о начале и конце этапа сообщают в интерком."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.rvr94qm7kuy7"
    },
    {
      "id": "ghosts",
      "title": "Призраки",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Визуальный модификатор превращает обычный раунд в призрачный комплекс.",
      "tech": [
        [
          "Всем",
          "Ghostly 255; Fade 255; Fog Control 5"
        ],
        [
          "После всех генераторов",
          "Эффект SCP-1344"
        ]
      ],
      "rules": [
        "Поддерживай эффекты до конца раунда.",
        "Новые участники получают те же настройки."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.0#heading=h.4lc3y0spbkj7"
    }
  ],
  "classic": [
    {"id":"global-d-block","title":"Битва за Д-блок","type":"global","code":"ГЛОБАЛЬНЫЙ ИВЕНТ","rank":"master","summary":"Матч в D-блоке с отдельными стартовыми камерами.","tech":[["Старт","По одному игроку в камере"],["Подготовка","Выход из D-блока закрыт"],["Формат","2–3 раунда"]],"rules":["Сначала выдай экипировку и объяви обратный отсчёт.","Двери открываются по команде проводящего; при необходимости проведи финал победителей."],"source":"https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.b2s330n80v5z"},
    {
      "id": "global-mog-chaos",
      "title": "МОГ против ПХ",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Командный матч МОГ и Повстанцев Хаоса в трёх зонах комплекса.",
      "tech": [
        [
          "Этапы",
          "3 раунда: ЛЗС, ТЗС, офисная зона"
        ],
        [
          "Состав",
          "Две равные команды"
        ],
        [
          "Подготовка",
          "1 минута на обсуждение тактики"
        ]
      ],
      "rules": [
        "Комплект игрового снаряжения выбирается голосованием.",
        "Победитель определяется в финале внутри выигравшей команды."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.nij4yp9ucoyx"
    },
    {
      "id": "global-hide-dogs",
      "title": "Прятки от собак",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игроки прячутся от SCP-939; выбывшие присоединяются к поиску.",
      "tech": [
        [
          "Старт",
          "D-класс и 2 SCP-939"
        ],
        [
          "Формат",
          "3 раунда, 3 зоны"
        ],
        [
          "Фора",
          "1 минута на укрытие"
        ]
      ],
      "rules": [
        "Вариант со светом или без него выбирают игроки. В темноте нужны фонари.",
        "Победитель — последний оставшийся участник за D-класс."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.50xo0pykcvas"
    },
    {
      "id": "global-ghetto",
      "title": "Гетто-перестрелка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Две команды с капитанами разыгрывают серию матчей.",
      "tech": [
        [
          "Команды",
          "D-класс и научные сотрудники"
        ],
        [
          "Этапы",
          "3 раунда со сменой капитанов"
        ],
        [
          "Капитан",
          "FSP-9, лёгкая броня, 170 HP"
        ]
      ],
      "rules": [
        "Остальные участники получают пистолеты, кроме револьвера, и аптечки.",
        "Если раунд длится больше 8 минут, появляется группа полиции; её победа означает ничью."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.ewfu66q7vx5d"
    },
    {
      "id": "global-jailbird",
      "title": "Битва на палках",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Три игровых арены и состязание с Jailbird до последнего участника.",
      "tech": [
        [
          "Роль",
          "D-класс"
        ],
        [
          "Этапы",
          "3 раунда на разных площадках"
        ],
        [
          "Инвентарь",
          "2 Jailbird каждому"
        ]
      ],
      "rules": [
        "Перед стартом дай время разойтись по площадке.",
        "Friendly Fire включается только после подготовки участников."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.8p7akf1y5ho"
    },
    {
      "id": "global-bombardment",
      "title": "Бомбардировка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Арена с игровыми препятствиями, сложность которой постепенно растёт.",
      "tech": [
        [
          "Площадки",
          "Боеголовка, комната SCP-106 или SCP-049/173"
        ],
        [
          "Подготовка",
          "Ограничить выходы и лифты"
        ],
        [
          "SCP-018",
          "Не более 2 активных одновременно"
        ]
      ],
      "rules": [
        "В начале сценария нельзя выбирать одного игрока постоянной целью.",
        "Темп и длительность этапов сверяй с вариантом своего сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.93l9f0bewcdp"
    },
    {
      "id": "global-tracker",
      "title": "Ищейка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Поиск спрятанных ключ-карт в трёх зонах комплекса.",
      "tech": [
        [
          "Зоны",
          "ТЗС, ЛЗС, поверхность"
        ],
        [
          "Тайники",
          "По 5 чёрных карт на зону"
        ],
        [
          "Раунды",
          "1"
        ]
      ],
      "rules": [
        "Перед размещением карт очисти зоны от лишних предметов.",
        "Выигрывает участник, собравший больше карт; при равенстве нужен дополнительный этап."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.cti55mw8glii"
    },
    {
      "id": "global-hunger-games",
      "title": "Голодные игры",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игроки ищут снаряжение на подготовленной арене и соревнуются за победу.",
      "tech": [
        [
          "Роль",
          "D-класс"
        ],
        [
          "Формат",
          "Одиночный или командный"
        ],
        [
          "Арена",
          "Зона на выбор организатора"
        ]
      ],
      "rules": [
        "Предметы раскладываются до появления участников.",
        "Помощники, которые знают размещение предметов, в матче не участвуют."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.3va6mk4hp0ai"
    },
    {
      "id": "global-scp-waves",
      "title": "Волны SCP",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Противостояние людей и SCP с усилением обеих сторон между волнами.",
      "tech": [
        [
          "Люди",
          "D-класс"
        ],
        [
          "Между волнами",
          "Усиление снаряжения людей и параметров SCP"
        ],
        [
          "Финал",
          "Один усиленный SCP: ориентир 8000 HP, масштаб 1.1"
        ]
      ],
      "rules": [
        "Поддерживай баланс двух сторон.",
        "Параметры финального SCP зависят от онлайна."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.sbbg8td4gnuz"
    },
    {
      "id": "global-cube",
      "title": "Куб",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Совместное исследование комплекса: за следующей дверью может быть находка или испытание.",
      "tech": [
        [
          "Старт",
          "D-класс в D-блоке; двери закрыты"
        ],
        [
          "Ключ-карты",
          "Доступ через КПП и гейты"
        ],
        [
          "SCP-500 / рация",
          "Возвращение участника / разведка комнаты"
        ]
      ],
      "rules": [
        "Игроки вместе выбирают следующую дверь.",
        "Содержимое комнат и награды подбираются под текущую зону и снаряжение команды."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.f4rd7rpl9mu1"
    },
    {
      "id": "global-scp-defense",
      "title": "Защита карманных SCP объектов",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Одна команда охраняет SCP-предметы, другая переносит их на свою базу.",
      "tech": [
        [
          "Команды",
          "Учёные / D-класс либо МОГ / ПХ"
        ],
        [
          "Формат",
          "1 раунд"
        ],
        [
          "База",
          "Гейт или интерком"
        ]
      ],
      "rules": [
        "MicroHID, TMP, Jailbird и SCP-127 не входят в разрешённое снаряжение.",
        "По истечении времени считают предметы у команд. Награда за этот сценарий не предусмотрена."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.9cdhw5s3in8v"
    },
    {
      "id": "global-duels",
      "title": "Дуэли",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Турнир парных игровых поединков по сетке.",
      "tech": [
        [
          "Арена",
          "Предпочтительно поверхность"
        ],
        [
          "Участники",
          "По двое, остальные наблюдают"
        ],
        [
          "Снаряжение",
          "По договорённости участников"
        ]
      ],
      "rules": [
        "Объясни порядок старта и включи Friendly Fire для арены.",
        "Победитель пары переходит дальше по турнирной сетке."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.vt1auvecoy5u"
    },
    {
      "id": "global-quarantine",
      "title": "Поветрие",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Игровой карантин: найди SCP-500 и успей добраться до убежища.",
      "tech": [
        [
          "Лимит",
          "10 минут"
        ],
        [
          "Старт",
          "Учёные на поверхности с зелёной картой"
        ],
        [
          "Убежище",
          "Бункер в компьютерной комнате"
        ]
      ],
      "rules": [
        "Доступ в убежище проверяют два охранника.",
        "После первых 2–3 минут появляются два SCP-049; в убежище SCP не входят."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.bsz7hlnyan9w"
    },
    {
      "id": "global-party",
      "title": "Смертельная вечеринка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Последовательность коротких игровых испытаний с одним итоговым победителем.",
      "tech": [
        [
          "Формат",
          "Серия мини-игр"
        ],
        [
          "Этапы",
          "Поиск предмета, гонка, прятки и другие задания"
        ],
        [
          "Победитель",
          "Один участник"
        ]
      ],
      "rules": [
        "Объясняй задание перед каждым этапом.",
        "Подбор этапов и спорные ситуации согласовывай с руководством."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.uqqcwj1uwj15"
    },
    {
      "id": "global-samurai",
      "title": "Битва самураев",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Две команды с одинаковым игровым снаряжением проходят три арены.",
      "tech": [
        [
          "Стороны",
          "МОГ / ПХ или учёные / D-класс"
        ],
        [
          "Этапы",
          "ЛЗС, офисная зона, поверхность"
        ],
        [
          "Инвентарь",
          "Мачете, игровая антикола и аптечка"
        ]
      ],
      "rules": [
        "Команды должны быть равными по числу игроков.",
        "После командной части проводится финал среди победивших."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.dtmyv5nti80q"
    },
    {
      "id": "global-jurassic",
      "title": "Парк Юрского периода",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Командный игровой режим с динозаврами в тяжёлой и офисной зонах.",
      "tech": [
        [
          "Динозавры Classic",
          "Movement Boost 10; 30 HP"
        ],
        [
          "Люди",
          "D-класс; E11-SR, средняя броня, карта менеджера зоны, аптечка"
        ],
        [
          "Этапы",
          "2 раунда"
        ]
      ],
      "rules": [
        "Закрой лифты в ЛЗС и к SCP-049/173.",
        "Динозавров должно быть немного меньше. Корректируй баланс, если одна сторона постоянно выигрывает."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.r01gwlc399k4"
    },
    {
      "id": "global-olympics",
      "title": "Олимпийские игры",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Команды выбирают представителей для игровых состязаний внутри SCP:SL.",
      "tech": [
        [
          "Участие",
          "Один представитель команды на этап"
        ],
        [
          "Счёт",
          "1 балл за выигранный этап"
        ],
        [
          "Примеры",
          "Гонка SCP-939, задание с SCP-914, меткость"
        ]
      ],
      "rules": [
        "Объяви условия до начала состязания и веди общий счёт.",
        "Награды получают участники этапов согласно итоговым баллам."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.6g4l5zrgyov3"
    },
    {
      "id": "global-reboot",
      "title": "Перезагрузка",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "master",
      "summary": "Раунд в темноте, где включение генераторов открывает следующие этапы.",
      "tech": [
        [
          "Начало",
          "D-блок; освещение выключено"
        ],
        [
          "Первый генератор",
          "SET MAX 200 для людей"
        ],
        [
          "Второй / третий",
          "Следующий комплект снаряжения / финальный этап"
        ]
      ],
      "rules": [
        "Число SCP зависит от онлайна: 1 при 15–19, 2 при 20–24, 3 при 25–35 и 4 при 36+.",
        "В начале SCP не заходят в ЛЗС 2 минуты; отключать генераторы и постоянно охранять их нельзя."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.xozvpbqz9eic"
    },
    {
      "id": "global-draw",
      "title": "Жребий",
      "type": "global",
      "code": "ГЛОБАЛЬНЫЙ ИВЕНТ",
      "rank": "senior",
      "summary": "Арена с короткими сменяющимися этапами и финалом для оставшихся участников.",
      "tech": [
        [
          "Роль и зона",
          "D-класс, камера SCP-173"
        ],
        [
          "Формат",
          "4 раунда"
        ],
        [
          "Смена этапа",
          "Предварительное объявление проводящего"
        ]
      ],
      "rules": [
        "Начинай с пустыми инвентарями участников.",
        "Ограничения игрового снаряжения различаются у NR и Classic — сверяй выбранную вкладку."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.ec8djpycjfsb"
    },
    {
      "id": "angel-demon",
      "title": "Демон и ангел",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Два персонажа выполняют игровые пожелания с разными условиями.",
      "tech": [
        [
          "Роли",
          "Демон — D-класс; ангел — учёный"
        ],
        [
          "Пожелания",
          "Одно за жизнь участника"
        ],
        [
          "Лимиты",
          "Эффекты до 20; масштаб 0.8–1.2"
        ]
      ],
      "rules": [
        "Не выдавай административные возможности и не меняй состояние всего сервера.",
        "Максимум HP: у демона 500, у ангела 300. Дополнительные ограничения зависят от роли."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.gv3mxh81boyh"
    },
    {
      "id": "pink-glasses",
      "title": "Мир в розовых очках",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Модификатор обычного раунда из каталога отдела.",
      "tech": [
        [
          "Формат",
          "Мини-ивент"
        ],
        [
          "Статус",
          "Зависит от сервера"
        ]
      ],
      "rules": [
        "Карточка содержит только сведения о наличии сценария; подробный план здесь не размещён."
      ],
      "source": null,
      "referenceOnly": true
    },
    {
      "id": "tiny-fixiks",
      "title": "Приключение фиксиков",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Обычный раунд, в котором модели всех участников становятся меньше.",
      "tech": [
        [
          "Масштаб",
          "0.3 / 0.3 / 0.3"
        ],
        [
          "Контроль",
          "Повторять настройку каждые 10 секунд в начале раунда"
        ],
        [
          "Новые волны",
          "Получают тот же масштаб"
        ]
      ],
      "rules": [
        "В первые 5 минут проверяй, что изменение применилось ко всем."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.z7yj7089dlzo"
    },
    {
      "id": "restaurant",
      "title": "Ресторан роллов Ёбидаёби",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игровой ресторан принимает заказы по рации и обменивает предметы на наборы.",
      "tech": [
        [
          "Реквизит",
          "Рация как телефон"
        ],
        [
          "Обмен",
          "Один игровой предмет за набор"
        ],
        [
          "Лимиты",
          "До 500 HP; эффекты до 20; масштаб 0.8–1.2"
        ]
      ],
      "rules": [
        "Меню и состав наборов объясни до начала обменов.",
        "Не выдавай GodMode, Noclip, Bypass и не вмешивайся в работу сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.z6e7wimm1zwg"
    },
    {
      "id": "lucky-coin",
      "title": "Монеточка удачи",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Аномальный персонаж исполняет игровые пожелания с непредсказуемым результатом.",
      "tech": [
        [
          "Пожелание",
          "Объявляется заранее"
        ],
        [
          "Масштаб",
          "0.8–1.2"
        ],
        [
          "Смена имени",
          "Только для обратившегося участника"
        ]
      ],
      "rules": [
        "Изменения ролей и перемещения ограничены сценарием.",
        "Не выдавай административные возможности и не меняй состояние всего сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.katbizcmef4k"
    },
    {
      "id": "family-walk",
      "title": "Семейная прогулка",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игроки выбирают прогулку семейства SCP-939 или группы маленьких SCP-173.",
      "tech": [
        [
          "SCP-939",
          "Взрослый и 2 щенка"
        ],
        [
          "Щенки",
          "Масштаб 0.5–0.7; до 750 HP; Heavy Footed 50–65"
        ],
        [
          "SCP-173",
          "4 участника; 2250 HP; Slowness 20; масштаб 0.6"
        ]
      ],
      "rules": [
        "Вариант выбирается голосованием.",
        "Уменьшенные SCP-173 держатся в одной зоне или перемещаются минимум парами."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.ewdnn965348e"
    },
    {
      "id": "cosmonaut",
      "title": "День космонавтики",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Модификатор движения с низкой гравитацией для обычного раунда.",
      "tech": [
        [
          "Всем",
          "LightWeight 185; Movement Boost 30"
        ],
        [
          "Только SCP",
          "Invigorated"
        ]
      ],
      "rules": [
        "Проверяй наличие эффектов у всех участников, включая новые появления."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.lh3kom6rmud0"
    },
    {
      "id": "echolocation",
      "title": "Эхолокация",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Право говорить через глобальный интерком переходит между игроками.",
      "tech": [
        [
          "Обычный онлайн",
          "4 случайных участника"
        ],
        [
          "Менее 15 игроков",
          "2 участника"
        ]
      ],
      "rules": [
        "Регулярно меняй участников, чтобы возможность получили разные игроки.",
        "В источнике расходятся интервалы 1 и 2 минуты: длительность уточни до запуска."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.t0un5kt0kv8f"
    },
    {
      "id": "fixik",
      "title": "Фиксик",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Маленький персонаж прячется в комплексе и награждает нашедших его.",
      "tech": [
        [
          "Проводящий",
          "Масштаб 0.1 / 0.1 / 0.1"
        ],
        [
          "Награда",
          "Случайный игровой предмет"
        ],
        [
          "Окончание",
          "Активация боеголовки"
        ]
      ],
      "rules": [
        "Нельзя повышать максимальное HP; обычное HP ограничено 250.",
        "Эффекты — до 20, изменение масштаба получателя — в пределах 0.8–1.2."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.txkriqr3e62p"
    },
    {
      "id": "court",
      "title": "Суд",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "master",
      "summary": "Короткая сценка с судьёй, защитником и участником игрового разбирательства.",
      "tech": [
        [
          "Роли",
          "Проводящий — судья; наблюдатель — защитник"
        ],
        [
          "Класс участников",
          "Обучение, без сброса инвентаря и позиции"
        ],
        [
          "Площадки",
          "PT-00 → MicroHID → интерком"
        ]
      ],
      "rules": [
        "По итогу проигравший теряет игровой инвентарь.",
        "Награда человеку: Jailbird и SET HP 200; SCP восстанавливает 300 HP."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.nug9cw5od6na"
    },
    {
      "id": "speed",
      "title": "Ускорение",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Весь раунд проходит с одинаковым бонусом скорости.",
      "tech": [
        [
          "Эффект",
          "Movement Boost 50"
        ],
        [
          "Получатели",
          "Все участники"
        ]
      ],
      "rules": [
        "Применяй эффект и к новым волнам МОГ, ПХ и D-класса."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.oizr855rpsx"
    },
    {
      "id": "shop",
      "title": "Магазин «Эльдорадо»",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Участники собирают игровые монеты и обменивают их в магазине.",
      "tech": [
        [
          "Монеты",
          "Размещаются в ТЗС в начале"
        ],
        [
          "Магазин",
          "Оружейная SCP-049"
        ],
        [
          "Цены",
          "От 1 до 6 игровых монет"
        ]
      ],
      "rules": [
        "Закрепи двери площадки в нужном состоянии до открытия.",
        "Категории товаров и их цены зафиксированы в исходном меню."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.4ew6yv50uvb2"
    },
    {
      "id": "questions",
      "title": "Нежеланные вопросы",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Викторина с тремя уровнями сложности и игровыми наградами.",
      "tech": [
        [
          "Подготовка",
          "Не менее 10 вопросов"
        ],
        [
          "Начало",
          "Через 3 минуты после старта раунда"
        ],
        [
          "Темп",
          "Один новый участник в минуту"
        ]
      ],
      "rules": [
        "Не приглашай повторно уже ответивших игроков.",
        "Можно использовать вопросы с вариантами ответа; подготовь ответы заранее."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.u2ihn0styikl"
    },
    {
      "id": "airdrop",
      "title": "Аир дроп",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "В комплексе последовательно появляются семь объявленных наборов припасов.",
      "tech": [
        [
          "Первое появление",
          "Через 2 минуты от начала"
        ],
        [
          "Интервал",
          "2 минуты между наборами"
        ],
        [
          "Оповещение",
          "Глобальный интерком"
        ]
      ],
      "rules": [
        "Место выбирает проводящий и сообщает его участникам.",
        "Содержимое семи наборов и порядок выдачи заданы в исходнике."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.7ldoz5flhiuq"
    },
    {
      "id": "baby",
      "title": "Кроха",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Дружелюбная мини-версия SCP-049 сопровождает обычный раунд.",
      "tech": [
        [
          "Участник",
          "Выбранный игрок за SCP-049"
        ],
        [
          "Масштаб",
          "0.6 / 0.6 / 0.6"
        ],
        [
          "Здоровье",
          "1200 HP"
        ]
      ],
      "rules": [
        "Изначально персонаж дружелюбен.",
        "Ответные действия допускаются только в рамках описанных в сценарии ситуаций."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.menaj3ubsn1q"
    },
    {
      "id": "mercenary",
      "title": "Наемник",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Игровой посредник принимает запросы на информацию и действия внутри раунда.",
      "tech": [
        [
          "Формат",
          "Обмен игровых предметов на услуги"
        ],
        [
          "Местоположение",
          "Сообщается через общий Broadcast"
        ],
        [
          "Перемещение",
          "В соседнюю с целью комнату"
        ]
      ],
      "rules": [
        "Сценарий различает запросы, направленные на людей и на SCP.",
        "Перед изменением параметров участника ему нужно отправить игровое уведомление."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.tbdyw8khxery"
    },
    {
      "id": "trust",
      "title": "Доверяй, но проверяй",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "К обычному составу SCP присоединяются дополнительные SCP-3114.",
      "tech": [
        [
          "От 18 игроков",
          "2 SCP-3114; ещё один через замену обычного SCP"
        ],
        [
          "Менее 18 игроков",
          "1 SCP-3114; ещё один через замену"
        ]
      ],
      "rules": [
        "Выбирай участников из игроков, а не назначай проводящих.",
        "Количество и возможность замены зависят от выбранного сервера."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.djmmjerosw81"
    },
    {
      "id": "wanted",
      "title": "Розыск",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "master",
      "summary": "Один участник пытается продержаться до конца таймера, остальные ищут его.",
      "tech": [
        [
          "Фора",
          "15 секунд"
        ],
        [
          "Поиск",
          "2 минуты"
        ],
        [
          "Между этапами",
          "15–45 секунд"
        ]
      ],
      "rules": [
        "Участник получает маркер «Обучение» без смены позиции и сброса инвентаря.",
        "SCP не назначаются разыскиваемыми; о начале и конце этапа сообщают в интерком."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.rvr94qm7kuy7"
    },
    {
      "id": "ghosts",
      "title": "Призраки",
      "type": "mini",
      "code": "МИНИ-ИВЕНТ",
      "rank": "junior",
      "summary": "Визуальный модификатор превращает обычный раунд в призрачный комплекс.",
      "tech": [
        [
          "Всем",
          "Ghostly 255; Fade 255; Fog Control 5"
        ],
        [
          "После всех генераторов",
          "Эффект SCP-1344"
        ]
      ],
      "rules": [
        "Поддерживай эффекты до конца раунда.",
        "Новые участники получают те же настройки."
      ],
      "source": "https://docs.google.com/document/d/1HnL7cfYVDZBox1ryELCWo1bYlRjdniMP8poQBtjfC7s/edit?tab=t.418r9abcsxd1#heading=h.4lc3y0spbkj7"
    }
  ]
};
