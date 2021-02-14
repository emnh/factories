vec3 hsv2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

	return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 mixN(vec3 a, vec3 b, float k)
{
    return sqrt(mix(a*a, b*b, clamp(k,0.,1.)));
}

vec4 V(vec2 p)
{
    return pixel(ch1, p);
}

void mainImage( out vec4 col, in vec2 pos )
{
	R = iResolution.xy; time = iTime;
    //pos = R*0.5 + pos*0.1;
    ivec2 p = ivec2(pos);
    
    vec4 data = texel(ch0, pos);
    particle P = getParticle(data, pos);
    
    //border render
    vec3 Nb = bN(P.X);
    float bord = smoothstep(2.*border_h,border_h*0.5,border(pos));
    
    vec4 rho = V(pos);
    vec3 dx = vec3(-2., 0., 2.);
    vec4 grad = -0.5*vec4(V(pos + dx.zy).zw - V(pos + dx.xy).zw,
                         V(pos + dx.yz).zw - V(pos + dx.yx).zw);
    vec2 N = pow(length(grad.xz),0.2)*normalize(grad.xz+1e-5);
    float specular = pow(max(dot(N, Dir(1.4)), 0.), 3.5);
    //float specularb = G(0.4*(Nb.zz - border_h))*pow(max(dot(Nb.xy, Dir(1.4)), 0.), 3.);
    
    float a = pow(smoothstep(fluid_rho*0., fluid_rho*2., rho.z),0.1);
    float b = exp(-1.7*smoothstep(fluid_rho*1., fluid_rho*7.5, rho.z));
    vec3 col0 = vec3(1.000,0.000,0.000);
    vec3 col1 = vec3(0.1, 0.4, 1.);
		vec3 fcol = mixN(col0, col1, tanh(3.*(rho.w - 0.7))*0.5 + 0.5);
    // Output to screen
    col = vec4(3.);
    col.xyz = mixN(col.xyz, fcol.xyz*(1.5*b + 0.0 * specular*5.), a);
    col.xyz = mixN(col.xyz, 0.*vec3(0.5,0.5,1.), bord);
    col.xyz = tanh(col.xyz);
    
    //col.ga = vec2(0.0);
    //col.rb = rho.xz;
    //col.xyz = vec3(specular);
    //return;
    
    vec2 q = pos.xy/iResolution.xy;

    vec3 e = vec3(vec2(1.)/iResolution.xy,0.);
    float f = 10.0;
    //float p10 = texture(iChannel0, q-e.zy).z;
    //float p01 = texture(iChannel0, q-e.xz).z;
    //float p21 = texture(iChannel0, q+e.xz).z;
    //float p12 = texture(iChannel0, q+e.zy).z;
    //float p10 = V(q-e.zy).y;
    //float p01 = V(q-e.xz).y;
    //float p21 = V(q+e.xz).y;
    //float p12 = V(q+e.zy).y;
    
    //vec4 w = texture(iChannel0, q);
    //vec4 w = rho.x;
    vec4 w = vec4(1.0);
    
    // Totally fake displacement and shading:
    //vec3 grad3 = normalize(vec3(p21 - p01, p12 - p10, 0.5));
    vec3 grad3 = vec3(grad.xz, 1.0);
    vec2 uv = pos*4./iChannelResolution3.xy + grad3.xy;
    uv = uv * 0.5;
    vec4 c = 2.0 * texture(iChannel3, uv);
    c += c * 0.5;
    c += c * w; // * (0.5 - distance(q, vec2(0.5)));
    c = vec4(1.0);
    vec3 lightDir = vec3(0.2, -0.5, 0.7);
    vec3 light = normalize(lightDir);
    
    //float diffuse = dot(grad3, light);
    float diffuse = dot(grad3, light);
    float spec = pow(max(0.,-reflect(light,grad3).z),32.);
    //vec4 col2 = tanh(mix(c,vec4(.7,.8,1.,1.),.25)*max(diffuse,0.) + spec);
    vec4 col2 = tanh(c*max(diffuse,0.) + spec);
    //col.xyz = a > 0.5 ? mixN(col.xyz, col.xyz * col2.xyz, 1.5) : col2.xyz;
    col.xyz = a > 0.5 ? 2.0 * col.xyz * col2.xyz : col2.xyz;
}
