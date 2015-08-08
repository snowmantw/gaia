import React, { PropTypes, Component } from 'react';

export default class Wallpaper extends Component {
	static propTypes = {
		imageBlobUrl: PropTypes.string.isRequired
	}
	
	render() {
		return (
			<div id='screenkeeper-wallpaper' style={{
				backgroundImage: 'url(' + this.props.imageBlobUrl + ')'
      }}></div>
		)
	}
}
