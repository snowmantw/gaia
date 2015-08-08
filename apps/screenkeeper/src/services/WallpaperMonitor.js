'use strict';

/* global Service */

import React, { PropTypes, Component } from 'react'
import * as Actions from '../actions/Actions'

export default class WallpaperMonitor extends Component {

	/**
	 * In services, UI is "doing effects", not only for view.
	 */
	render() {
		const { dispatch } = this.props
		dispatch(Actions.changeWallpaper(this.state.imageBlobUrl))
		return ()	// Service needn't a view
	}
	

	componentDidMount() {
    if (Service.query('getWallpaper')) {
      var wallpaperURL = Service.query('getWallpaper');
      if (wallpaperURL) {
        this.setState( {'imageBlobUrl': wallpaperURL} );
      }
    }
    window.addEventListener('wallpaperchange', this);
	}
	
	componentWillUnmount() {
    window.removeEventListener('wallpaperchange', this);
	}

  handleEvent(event) {
    switch (event.type) {
      case 'wallpaperchange':
        this.setState( {'imageBlobUrl': event.detail.url} );
        break;
    }
  }
}
