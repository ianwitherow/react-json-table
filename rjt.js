var React = require('react');
var cs = require('classnames');

var $ = React.DOM;

// Some shared attrs for JsonTable and JsonRow
var defaultSettings = {
		header: true,
		noRowsMessage: 'No items',
		classPrefix: 'json'
	},
	getSetting = function( name ){
		var settings = this.props.settings;

		if( !settings || typeof settings[ name ] == 'undefined' )
			return defaultSettings[ name ];

		return settings[ name ];
	}
;

var JsonTable = React.createClass({
	getSetting: getSetting,

	render: function(){
		if (!this.props.rows || this.props.rows.length === 0) {
			var noRowsMessage = this.getSetting('noRowsMessage');
			if (typeof(noRowsMessage) === 'object') {
				// If noRowsMessage is an element, return it
				return noRowsMessage;
			} else {
				// If it's a string, render it within a <div> element
				return $.div({}, this.getSetting('noRowsMessage'));
			}
		}

		var cols = this.normalizeColumns(),
			contents = [this.renderRows( cols )]
		;

		if( this.getSetting('header') )
			contents.unshift( this.renderHeader( cols ) );

		var tableClass = cs(
			this.getSetting( 'classPrefix' ) + 'Table',
			this.props.className
		);

		return $.table({ className: tableClass }, contents );
	},

	renderHeader: function( cols ){
		var me = this,
			prefix = this.getSetting( 'classPrefix' ),
			headerClass = this.getSetting( 'headerClass' ),
			cells = cols.map( function(col){
				var className = prefix + 'Column';
				if (headerClass) {
					className = headerClass( className, col.key );
				}
				
				if (col.label.indexOf('$') > -1 || col.label.indexOf('GP') > -1 || col.label.indexOf('Revenue') > -1) {
					className += " text-right";
				}

				return $.th(
					{ className: className, key: col.key, onClick: me.onClickHeader, "data-key": col.key },
					col.label
				);
			})
		;

		return $.thead({ key: 'th'},
			$.tr({ key: this.getSetting('classPrefix') + 'THead', className: prefix + 'Header' }, cells )
		);
	},

	renderRows: function( cols ){
		var me = this,
			items = this.props.rows,
			settings = this.props.settings || {};

		var rows = items.map( function( item, index ){
			var key = me.getKey( item );
			return React.createElement(Row, {
				key: index,
				reactKey: key,
				item: item,
				settings: settings,
				columns: cols,
				i: index,
				onClickRow: me.onClickRow,
				onClickCell: me.onClickCell
			});
		});

		return $.tbody({ key: this.getSetting('classPrefix') + 'TBody' }, rows);
	},

	getItemField: function( item, field ){
		return item[ field ];
	},

	normalizeColumns: function(){
		var getItemField = this.getItemField,
			cols = this.props.columns,
			items = this.props.rows
		;

		if( !cols ){
			if( !items || !items.length )
				return [];

			return Object.keys( items[0] ).map( function( key ){
				return { key: key, label: key, cell: getItemField };
			});
		}

		return cols.map( function( col ){
			var key;
			if( typeof col == 'string' ){
				return {
					key: col,
					label: col,
					cell: getItemField
				};
			}

			if( typeof col == 'object' ){
				key = col.key || col.label;

				// This is about get default column definition
				// we use label as key if not defined
				// we use key as label if not defined
				// we use getItemField as cell function if not defined
				return {
					key: key,
					label: col.label || key,
					cell: col.cell || getItemField
				};
			}

			return {
				key: 'unknown',
				name:'unknown',
				cell: 'Unknown'
			};
		});
	},

	getKey: function( item ){
		var field = this.props.settings && this.props.settings.keyField;
		if( field && item[ field ] )
			return item[ field ];

		if( item.id )
			return item.id;

		if( item._id )
			return item._id;
	},

	shouldComponentUpdate: function(){
		return true;
	},

	onClickRow: function( e, item ){
		if( this.props.onClickRow ){
			this.props.onClickRow( e, item );
		}
	},

	onClickHeader: function( e ){
		if( this.props.onClickHeader ){
			this.props.onClickHeader( e, e.target.dataset.key );
		}
	},

	onClickCell: function( e, key, item ){
		if( this.props.onClickCell ){
			this.props.onClickCell( e, key, item );
		}
	}
});

var Row = React.createClass({
	getSetting: getSetting,

	render: function() {
		var me = this,
			props = this.props,
			cellClass = this.getSetting('cellClass'),
			rowClass = this.getSetting('rowClass'),
			prefix = this.getSetting('classPrefix'),
			cells = props.columns.map(function(col) {
				var content = col.cell,
					key = col.key,
					className = prefix + 'Cell ' + prefix + 'Cell_' + key;

				if (cellClass)
					className = cellClass( className, key, props.item );

				if (typeof content == 'function') {
					content = content(props.item, key);
				}
				// Make sure content is not null
				content = content || '';

				if (content.toString().indexOf('$') === 0 || content.toString().indexOf('$') === 1) {
					// Currency - align right
					className += " text-right";
				}
				if (content.toString().trim().length === 0) {
					// Put in a space so the row isn't all stupid
					content = '<div>&nbsp;</div>';
				}


				return $.td( {
					className: className,
					key: key,
					"data-key": key,
					onClick: me.onClickCell,
					dangerouslySetInnerHTML: {__html: content}
				});
			})
		;

		var className = prefix + 'Row ' + prefix +
			(props.i % 2 ? 'Odd' : 'Even')
		;

		if( props.reactKey )
			className += ' ' + prefix + 'Row_' + props.reactKey;

		if( rowClass )
			className = rowClass( className, props.item );

		return $.tr({
			className: className,
			onClick: me.onClickRow
		}, cells );
	},

	onClickCell: function( e ){
		this.props.onClickCell( e, e.target.dataset.key, this.props.item );
	},

	onClickRow: function( e ){
		this.props.onClickRow( e, this.props.item );
	}
});

module.exports = JsonTable;
