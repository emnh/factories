varying vec2 vUV;

void mainImage( out vec4 col, in vec2 pos )
{
	//float height = texture(iChannel3, vUV).x;
  //col = vec4(vUV.x, vUV.y, 0.0, 1.0); 
	col = texture2D(iChannel0, vUV);
}
