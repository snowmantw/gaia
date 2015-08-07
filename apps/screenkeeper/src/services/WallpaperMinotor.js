import React, { PropTypes, Component } from 'react'
import * as Actions from '../actions/Actions'

export default class WallpaperMonitor extends Component {

	/**
	 * In services, UI is "doing effects", not only for view.
	 */
	render() {
		const { dispatch } = this.props
		dispatch(Actions.changeWallpaper(this.state._imageBlobUrl))
		return ()	// Service needn't a view
	}
	

	componentDidMount() {

	}
	
	componentWillUnmount() {

	}
	
	/**
	 * First time we need to fetch them manually.
	 */
	_fetchImageBlobUrl() {

	}
	

}