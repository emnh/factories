uniform vec2 iResolution;
uniform vec2 iResolutionOne;
uniform vec4 iMouse;
uniform float iTime;
uniform int iFrame;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec2 iChannelResolution0;
uniform vec2 iChannelResolution1;
uniform vec2 iChannelResolution2;
uniform vec2 iChannelResolution3;

#define zextra 2.0
#define Bf(p) p
#define Bi(p) ivec2(p)
#define texel(a, p) texelFetch(a, Bi(p), 0)
#define pixel(a, p) texture(a, (p)/R)
#define ch0 iChannel0
#define ch1 iChannel1
#define ch2 iChannel2
#define ch3 iChannel3

#define PI 3.14159265

#define loop(i,x) for(int i = 0; i < x; i++)
#define range(i,a,b) for(int i = a; i <= b; i++)

#define dt 1.5

#define border_h 5.
vec2 R;
vec4 Mouse;
float time;

#define mass 1.

#define fluid_rho 0.5

float Pf(vec2 rho)
{
    //return 0.2*rho.x; //gas
    float GF = 1.;//smoothstep(0.49, 0.5, 1. - rho.y);
    return mix(0.5*rho.x,0.04*rho.x*(rho.x/fluid_rho - 1.), GF); //water pressure
}

mat2 Rot(float ang)
{
    return mat2(cos(ang), -sin(ang), sin(ang), cos(ang)); 
}

vec2 Dir(float ang)
{
    return vec2(cos(ang), sin(ang));
}


float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float border(vec2 p)
{
    float bound = -sdBox(p - R*0.5, R*vec2(0.5, 0.5)); 
    float box = sdBox(Rot(0.*time)*(p - R*vec2(0.5, 0.6)) , R*vec2(0.05, 0.01));
    float drain = -sdBox(p - R*vec2(0.5, 0.7), R*vec2(1.5, 0.5));
    return max(drain,min(bound, box));
}

#define h 1.
vec3 bN(vec2 p)
{
    vec3 dx = vec3(-h,0,h);
    vec4 idx = vec4(-1./h, 0., 1./h, 0.25);
    vec3 r = idx.zyw*border(p + dx.zy)
           + idx.xyw*border(p + dx.xy)
           + idx.yzw*border(p + dx.yz)
           + idx.yxw*border(p + dx.yx);
    return vec3(normalize(r.xy), r.z + 1e-4);
}

uint pack(vec2 x)
{
    x = 65534.0*clamp(0.5*x+0.5, 0., 1.);
    return uint(round(x.x)) + 65535u*uint(round(x.y));
}

vec2 unpack(uint a)
{
    vec2 x = vec2(a%65535u, a/65535u);
    return clamp(x/65534.0, 0.,1.)*2.0 - 1.0;
}

vec2 decode(float x)
{
    uint X = floatBitsToUint(x);
    return unpack(X); 
}

float encode(vec2 x)
{
    uint X = pack(x);
    return uintBitsToFloat(X); 
}

struct particle
{
    vec3 X;
    vec3 V;
    vec2 M;
};

struct position {
  vec2 tpos;
  vec2 tposZ;
  vec3 addpos;
  bool valid;
};

position getPos(vec2 pos, int i, int j, int k) {
  position p;
  vec2 tpos = pos.xy;
  uint px = uint(floor(pos.x));
  if (px % uint(2) == uint(1)) {
    tpos.x -= 1.0;
  }
  //tpos.x = floor(floor(pos.x) / float(zextra)) * float(zextra) + fract(pos.x);
  //vec2 tpos = pos.xy - vec2(mod(floor(pos.x), float(zextra)), 0.0);
  float kbase = floor(floor(tpos.x) / (max(1.0, iResolutionOne.x) * zextra));
  //float posx = floor((floor(tpos.x) - kbase) / zextra);
  int ke = int(kbase) + k;
  if (ke < 0 || ke >= int(floor(iResolution.x / (max(1.0, iResolutionOne.x) * zextra)))) {
    k = 0;
    p.valid = false;
  } else {
    p.valid = true;
  }
  p.tpos = tpos + vec2(float(k) * float(iResolutionOne.x) * zextra, 0.0) + vec2(float(i) * zextra, j);
  p.tposZ = p.tpos + vec2(1.0, 0.0);
  float posx = floor((floor(tpos.x) - kbase) / zextra);
  p.addpos = vec3(posx + fract(tpos.x), pos.y, kbase + 0.5) + vec3(i, j, k);

  /*
  p.tpos = pos.x >= iResolutionOne.x ? pos - vec2(iResolution.x, 0.0) : pos;
  p.tposZ = pos.x < iResolutionOne.x ? floor(pos) * vec2(2.0, 1.0) + fract(pos) : pos;
  p.addpos = vec3(i, j, float(k) + 0.5);
  */

  return p;
}
    
particle getParticle(vec4 data, vec4 data2, vec3 pos)
{
    particle P; 
    P.X.xy = decode(data.x) + pos.xy;
    P.V.xy = decode(data.y);
    vec2 zz = decode(data2.x);
    //vec2 zz = vec2(0.0, 0.0);
    //vec2 zz = data2.xy;
    P.X.z = zz.x + pos.z;
    P.V.z = zz.y;
    P.M = data.zw;
    return P;
}

vec4 saveParticle(particle P, vec2 pos, vec3 addpos)
{
    P.X = clamp(P.X - addpos, vec3(-0.5), vec3(0.5));
    //P.X.z = 0.0;
    //P.V.z = 0.0;
    //P.V = clamp(P.V, vec3(-0.5), vec3(0.5));

    uint px = uint(floor(pos.x));
    if (px % uint(2) == uint(0)) {
      return vec4(encode(P.X.xy), encode(P.V.xy), P.M);
    } else {
      vec2 zz = vec2(P.X.z, P.V.z);
      return vec4(encode(zz), 0.0, 0.0, 0.0);
      //return vec4(zz.x, zz.y, 0.0, 0.0);
    }
}

vec3 hash32(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}

float G(vec3 x)
{
    return 0.1 * exp(-dot(x,x));
    //return dot(x,x);
}

float G0(vec3 x)
{
    return exp(-length(x));
}

//diffusion amount
#define dif 1.12

vec4 distribution(vec3 x, vec3 p, float K)
{
    vec3 omin = clamp(x - K*0.5, p - 0.5, p + 0.5);
    vec3 omax = clamp(x + K*0.5, p - 0.5, p + 0.5); 
    return vec4(0.5*(omin + omax), (omax.x - omin.x)*(omax.y - omin.y)*(omax.z - omin.z)/(K*K*K));
    //return vec4(0.5*(omin + omax), (omax.x - omin.x)*(omax.y - omin.y)/(K*K));
}

//diffusion and advection basically
void Reintegration(sampler2D ch, inout particle P, vec2 pos)
{
    //basically integral over all updated neighbor distributions
    //that fall inside of this pixel
    //this makes the tracking conservative
    range(i, -2, 2) range(j, -2, 2) range(k, -2, 2)
    {
        position tpos = getPos(pos, i, j, k);
        vec3 u = vec3(i, j, k);
        float l = length(u);
        if (l > 0.0 && tpos.valid) {
          vec4 data = texel(ch, tpos.tpos);
          vec4 data2 = texel(ch, tpos.tposZ);
          particle P0 = getParticle(data, data2, tpos.addpos);
         
          P0.X += P0.V*dt; //integrate position

          float difR = 0.9 + 0.21*smoothstep(fluid_rho*0., fluid_rho*0.333, P0.M.x);
          //difR = 1.1;
          vec4 D = distribution(P0.X, tpos.addpos, difR);
          //the deposited mass into this cell
          float m = P0.M.x*D.w;
          
          //add weighted by mass
          P.X += D.xyz*m;
          P.V += P0.V*m;
          P.M.y += P0.M.y*m;
          
          //add mass
          P.M.x += m;
        }
    }
    
    //normalization
    if(P.M.x != 0.)
    {
        P.X /= P.M.x;
        P.V /= P.M.x;
        P.M.y /= P.M.x;
    }
}

//force calculation and integration
void Simulation(sampler2D ch, inout particle P, vec2 pos)
{
    //Compute the SPH force
    vec3 F = vec3(0.);
    vec4 avgV = vec4(0.);

    range(i, -2, 2) range(j, -2, 2) range(k, -2, 2)
    {
        vec3 u = vec3(i, j, k);
        float l = length(u);
        position tpos = getPos(pos, i, j, k);
        if (l > 0.0 && tpos.valid) {
          vec4 data = texel(ch, tpos.tpos);
          vec4 data2 = texel(ch, tpos.tposZ);
          particle P0 = getParticle(data, data2, tpos.addpos);

          vec3 dx = P0.X - P.X;
          float avgP = 0.5*P0.M.x*(Pf(P.M) + Pf(P0.M)); 
          F -= 0.5*G(1.*dx)*avgP*dx;
          //F += 0.0 * dx;
          if (length(dx) < 1.0) {
              float d = length(dx);
              //F -= 0.0001 * dx;
              //F *= 0.0000000001 * dx;
          }
          avgV += P0.M.x*G(1.*dx)*vec4(P0.V,1.);
        }
    }
    //F /= vec2(10.0);
    if (avgV.w != 0.0) {
      avgV.xyz /= avgV.w;
    }

    //viscosity
    // TODO: reenable
    //F += 0.*P.M.x*(avgV.xyz - P.V);
    
    //gravity
    // TODO: reenable
    //F -= P.M.x*vec3(0., 0.0004, 0.0);
    
    /*
    vec2 PDC = P.X.xy - 0.5 * R;
    if (length(PDC) < length(0.1 * R)) {
        F -= P.M.x*0.0001*(vec3(PDC, 0.0));
    }
    vec3 PDC2 = P.X - vec3(0.5 * R, 0.5);
    if (length(PDC2) < length(R)) {
        F -= P.M.x*0.0001*(PDC2);
    }
    */
    float PDC3 = abs(P.X.z - 0.5);
    if (PDC3 < 1.0) {
        //F.z -= P.M.x*0.0001*(PDC3);
    }
    //F -= P.M.x*0.01*(center.xy);


    /*
    if(Mouse.z > 0.)
    {
        vec3 dm = vec3((Mouse.xy - Mouse.zw)/10., 0.0); 
        float d = distance(Mouse.xy, P.X.xy)/20.;
        F += 0.001*dm*exp(-d*d);
       // P.M.y += 0.1*exp(-40.*d*d);
    }
    */
    
    //integrate
    if (P.M.x > 0.0) {
      //P.V += F*dt/P.M.x;
      //P.V += F*dt/P.M.x;
    }

    //border 
    /*
    vec3 N = bN(P.X.xy);
    float vdotN = step(N.z, border_h)*dot(-N.xy, P.V.xy);
    P.V.xy += 0.5*(N.xy*vdotN + N.xy*abs(vdotN));
    P.V.xy += 0.*P.M.x*N.xy*step(abs(N.z), border_h)*exp(-N.z);
    
    if(N.z < 0.) P.V = vec3(0.);
    */

    //velocity limit
    //P.V *= 0.997;
    // TODO: reenable
    float v = length(P.V);
    P.V /= (v > 1.)?v:1.;
}
