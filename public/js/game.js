var Game = new Class({
	Implements: [Options],

	options: {
		angle: 10, // angle d'orientation par défaut
		stepDeg: 3, // nombre de degré incrémenté lors d'une rotation
		mapWidth: 1200,
		mapHeight: 600,
		areaZoom: 1.2 // zoom par rappor à la taille de la map pour ne pas en sortir
	},

	initialize: function(options) {
		this.setOptions(options);

		this.debug = window.location.search.test('debug');;
		if ( this.debug ) { $(document.body).addClass('onDebug'); }
		this.map = {
			perspective: 1000,
			areaWidth: 500,
			mapWidth: this.options.mapWidth,
			ratioAreaWidth: 1,
			areaHeight: 500,
			mapHeight: this.options.mapHeight,
			ratioAreaHeight: 1,
			angle: this.options.angle,
			angleMin: 0,
			angleMax: 20
		};

		this.player = {
			name: '',
			avatar: false,
			server: window.location.hash != '' ? window.location.hash.substr(1, window.location.hash.length) : 1,
			hostname: window.location.hostname,
			port: window.location.port != '' ? window.location.port : 8080
		}

		// charge le cookie des configs
		var cookie = Cookie.read('player');
		if ( cookie ) {
			cookie = JSON.decode(cookie);
			if ( cookie.name ) this.player.name = cookie.name;
			if ( cookie.avatar ) this.player.avatar = cookie.avatar;
		}

		this.areaResize(); // Taille de la zone du jeu disponible
		this.gameSize(); // Construction de la taille de la MAP et du JEU
		this.mapRotate(); // Rotation de l'angle par défaut

		// traitement des datas
		Object.each(HIT.data.avatars, function(data, k) {
			HIT.data.avatars[k] = new Element('img', {'src': data});
			// construction de l'avatar picker
			var avatar = new Element('div', {
				'id': 'avatar-'+k,
				'data-id': k,
				'class': 'avatar avatar-x-'+HIT.data.avatars[k].width+' avatar-y-'+HIT.data.avatars[k].height,
				'styles': {
					'width': HIT.data.avatars[k].width/4,
					'height': HIT.data.avatars[k].height/4,
					'background-image': 'url('+data+')'
				}
			}).inject('player-avatars');
		});

		// événement du resize et de la molette de la souris
		window.addEvent('resize', function() { this.areaResize(); }.bind(this));
		window.addEvent('mousewheel', function(e) {
			if ( e.wheel > 0 )
				this.map.angle -= this.options.stepDeg;
			else if ( e.wheel < 0 )
				this.map.angle += this.options.stepDeg;

			this.mapRotate();
		}.bind(this));

		// avatar picker
		$$('#player-avatars .pick').addEvent('click', function() {
			var avatar = false;
			var first = $('player-avatars').getFirst('.avatar');
			var last = $('player-avatars').getLast('.avatar');
			var previous = $('player-avatars').getFirst('.selected').getPrevious('.avatar');
			var next = $('player-avatars').getFirst('.selected').getNext('.avatar');
			if ( this.hasClass('previous') ) {
				if ( previous )
					avatar = previous;
				else
					avatar = last;
			}
			else if ( this.hasClass('next') ) {
				if ( next )
					avatar = next;
				else
					avatar = first;
			}

			// met a jour l'avatar sélectionné
			if ( avatar ) {
				avatar = avatar.get('data-id');
				$('player-avatar').set('value', avatar);
				$$('#player-avatars .avatar').removeClass('selected');
				$('avatar-'+avatar).addClass('selected');
			}
		});
		// auto-sélectionne l'avatar (soit dans le cookie, soit le 1er de la liste)
		if ( !this.player.avatar || !HIT.data.avatars[this.player.avatar] )
			this.player.avatar = $('player-avatars').getFirst('.avatar').get('data-id');

		// preselectionne l'avatar
		$('player-avatar').set('value', this.player.avatar);
		$('avatar-'+this.player.avatar).addClass('selected');

		// autorempli le pseudo
		if ( this.player.name && this.player.name != '' )
			$('player-name').set('value', this.player.name);

		// formulaire de connexion
		$('box-login').getElement('form').addEvent('submit', function(e) {
			e.stop().stopPropagation();

			$('box-login').getElement('.error').removeClass('show');

			// le joueur n'est pas encore connecté
			if ( !$(document.body).hasClass('onPlayerConnected') ) {
				this.player.name = $('player-name').get('value');
				this.player.avatar = $('player-avatar').get('value');

				// erreur si le pseudo est vide
				if ( this.player.name == '' ) {
					this.animate($('box-login').getElement('.box'), 'wobble', 750);
					$('box-login').getElement('.error').addClass('show');
					$('box-login').getElement('.error').set('text', 'Veuillez indiquer votre pseudo !');
					return;
				}
				if ( HIT.data.avatars[this.player.avatar] == undefined) {
					this.animate($('box-login').getElement('.box'), 'wobble', 750);
					$('box-login').getElement('.error').addClass('show');
					$('box-login').getElement('.error').set('text', 'Avatar invalide !');
					return;
				}

				// écrit un cookie avec les configs du login
				Cookie.write('player', JSON.encode({'name': this.player.name, 'avatar': this.player.avatar}), {duration: 30});

				// connexion WS
				HIT.client = new Client({
					websocket: 'ws:'+this.player.hostname+':'+this.player.port+'/',
					server: this.player.server,
					name: this.player.name,
					avatar: this.player.avatar,
				});

				$('game').focus();
				$(document.body).addClass('onPlayerConnected');
			}
		}.bind(this));

		// chargement OK, affiche la page de login
		(function() { $('player-name').focus(); $(document.body).addClass('onGameLoaded'); }).delay(250);
	},

	areaResize: function() {
		var s = window.getSize();

		this.map.areaWidth = s.x;
		this.map.areaHeight = s.y;

		// la taille de la map est plus petite que l'écran, on redimensionne 
		if ( this.map.mapWidth < this.map.areaWidth*this.options.areaZoom )
			this.map.areaWidth = this.map.mapWidth/this.options.areaZoom;
		if ( this.map.mapHeight < this.map.areaHeight*this.options.areaZoom )
			this.map.areaHeight = this.map.mapHeight/this.options.areaZoom;

		// calcul des nouveau ratio
		this.map.ratioAreaWidth = this.map.areaWidth / this.map.mapWidth;
		this.map.ratioAreaHeight = this.map.areaHeight / this.map.mapHeight;

		// détermine la perspective
		this.map.perspective = this.map.areaHeight * 2;
		$('game-area').setStyles({
			'width': this.map.areaWidth,
			'height': this.map.areaHeight,
			'perspective': this.map.perspective + 'px'
		});
	},

	mapRotate: function() {
		// teste si l'angle n'est pas trop grand
		if ( this.map.angle < this.map.angleMin )
			this.map.angle = this.map.angleMin;
		else if ( this.map.angle > this.map.angleMax )
			this.map.angle = this.map.angleMax;

		$('map').setStyle('transform', 'translateY(-50%) translateX(-50%) translateZ(0) rotateX('+this.map.angle+'deg)');
	},

	gameSize: function() {
		$$('#map, #game').setStyles({
			'width': this.map.mapWidth,
			'height': this.map.mapHeight
		});

	},

	/**
	* Animation CSS3 d'un element
	*
	* @param el {element} element qu'il faut animer
	* @param animation {string} nom de l'aniamtion (blink, bounce, shake, swing, wobble, pulse...)
	* @param duration {int} durée de l'animation en ms (0=infinite, -1=supprimer l'animation)
	*/
	animate: function(el, animation, duration) {
		if ( typeOf(el) == 'string' ) el = $(el)
		if ( el ) {
			if ( !duration ) duration = 0;
			duration = Fx.Durations[duration] || duration.toInt();
			if ( duration >= 0 ) {
				el.addClass('onAnimation').addClass('hit-anim').addClass(animation);
				if ( duration > 0 ) {
					el.addClass('hit-anim-' + duration);
					(function() {this.animate(el, animation, -1);}).delay(duration, this);
				}
			}
			else
				el.removeClass(animation).removeClass('hit-anim').removeClass('onAnimation').removeClass('hit-anim-250').removeClass('hit-anim-500').removeClass('hit-anim-750').removeClass('hit-anim-1000');
		}
	},
});

window.addEvent('domready', function() {
	HIT.game = new Game();
});